import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { paginationSchema } from "@iffe/shared";
import type { Prisma } from "@prisma/client";
import { Money } from "@iffe/ledger";
import { prisma, withTx } from "../config/db";
import { flags } from "../config/flags";
import { authMiddleware, requireRole, type AuthEnv } from "../middleware/auth";
import { writeAuditLog } from "../utils/audit";
import { logger } from "../utils/logger";
import { mapMethodToLedgerSource } from "../utils/payment-method";
import { runWorkflow } from "../workflows/runtime";
import { depositWorkflow } from "../workflows/deposit.workflow";
import { z } from "zod/v4";

const depositRequests = new Hono<AuthEnv>();
depositRequests.use("*", authMiddleware);

const createSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number().min(1000, "Minimum deposit is 1,000"),
  method: z.string().default("cash"),
  description: z.string().optional(),
});

depositRequests.get("/", zValidator("query", paginationSchema), async (c) => {
  const { page = 1, limit = 20, search, sortOrder = "desc" } = c.req.valid("query");
  const user = c.get("user");
  if (!["admin", "staff", "member"].includes(user.role)) {
    throw new HTTPException(403, { message: "Insufficient permissions" });
  }

  const where: Prisma.DepositRequestWhereInput = {};
  if (user.role === "member" && user.memberId) {
    where.memberId = user.memberId;
  }
  if (search) where.OR = [{ description: { contains: search, mode: "insensitive" } }];
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.depositRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: sortOrder },
    }),
    prisma.depositRequest.count({ where }),
  ]);

  const accountIds = Array.from(new Set(data.map((request) => request.accountId)));
  const accounts =
    accountIds.length > 0
      ? await prisma.account.findMany({
          where: { id: { in: accountIds } },
          include: { member: true },
        })
      : [];
  const accountsById = new Map(accounts.map((account) => [account.id, account]));
  const enrichedData = data.map((request) => ({
    ...request,
    account: accountsById.get(request.accountId) ?? null,
  }));

  return c.json({
    success: true,
    data: { data: enrichedData, total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

depositRequests.post("/", requireRole("member"), zValidator("json", createSchema), async (c) => {
  const data = c.req.valid("json");
  const user = c.get("user");
  if (!user.memberId) {
    throw new HTTPException(403, { message: "Only members can create deposit requests" });
  }

  const account = await prisma.account.findFirst({
    where: { id: data.accountId, memberId: user.memberId },
  });
  if (!account) {
    throw new HTTPException(404, { message: "Account not found" });
  }
  if (account.status !== "active") {
    throw new HTTPException(400, { message: "Account is not active" });
  }

  const req = await prisma.depositRequest.create({ data: { ...data, memberId: user.memberId } });
  await writeAuditLog(c, {
    action: "deposit_request_created",
    entity: "deposit_request",
    entityId: req.id,
    details: { amount: req.amount },
  });
  return c.json({ success: true, data: req }, 201);
});

depositRequests.patch("/:id/approve", requireRole("admin", "staff"), async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  // Step 1 — validate outside any transaction. Cheap reads; a clean
  // 404/400 before we touch the ledger is worth more than atomicity
  // on the entire approve operation.
  const existing = await prisma.depositRequest.findUnique({ where: { id } });
  if (!existing) throw new HTTPException(404, { message: "Deposit request not found" });
  if (existing.status !== "pending") {
    throw new HTTPException(400, { message: "Deposit request has already been processed" });
  }

  let result: typeof existing;

  if (flags.ledgerEnabled) {
    // Phase 10 path: route through the deposit workflow so the ledger
    // gets a balanced journal entry (Dr cash / Cr member savings)
    // alongside the Account.balance projection and Transaction row.
    // The workflow is idempotent on its idempotencyKey — a retried
    // approval is a no-op for the ledger and still flips the request
    // status below.
    logger.info(
      { event: "deposit_request.approve.workflow", depositRequestId: id, amount: existing.amount },
      "approving deposit request via ledger workflow",
    );
    await runWorkflow(depositWorkflow, {
      idempotencyKey: `deposit-request:${id}`,
      startedBy: user.id,
      input: {
        memberAccountId: existing.accountId,
        amount: Money.toString(Money.fromDb(existing.amount)),
        method: existing.method,
        description: existing.description || "Approved deposit request",
        processedBy: user.id,
        sourceOfFunds: mapMethodToLedgerSource(existing.method),
      },
    });

    // Flip the request status. The workflow has already written the
    // Account, Journal, and Transaction rows — this single update is
    // the only piece of work not atomic with the workflow post. If it
    // fails, a retried approval succeeds because the workflow
    // idempotency key short-circuits and the status update runs fresh.
    result = await prisma.depositRequest.update({
      where: { id },
      data: { status: "approved", processedBy: user.id },
    });
  } else {
    // Legacy kill-switch path. Reachable via LEDGER_ENABLED=false env.
    // Identical to pre-Phase-10 behaviour: Transaction + Account
    // balance + request status change in one DB transaction.
    logger.warn(
      { event: "deposit_request.approve.legacy", depositRequestId: id },
      "approving deposit request via legacy direct-balance path (LEDGER_ENABLED=false)",
    );
    result = await withTx(async (tx: Prisma.TransactionClient) => {
      const req = await tx.depositRequest.update({
        where: { id },
        data: { status: "approved", processedBy: user.id },
      });
      await tx.transaction.create({
        data: {
          accountId: req.accountId,
          type: "deposit",
          amount: req.amount,
          method: req.method,
          description: req.description || "Approved deposit request",
          status: "completed",
          processedBy: user.id,
        },
      });
      await tx.account.update({
        where: { id: req.accountId },
        data: { balance: { increment: req.amount }, lastActivity: new Date() },
      });
      return req;
    });
  }

  await writeAuditLog(c, {
    action: "deposit_request_approved",
    entity: "deposit_request",
    entityId: result.id,
    details: { ledgerEnabled: flags.ledgerEnabled, amount: result.amount },
  });
  return c.json({ success: true, data: result });
});

depositRequests.patch("/:id/reject", requireRole("admin", "staff"), async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const existing = await prisma.depositRequest.findUnique({ where: { id } });
  if (!existing) throw new HTTPException(404, { message: "Deposit request not found" });
  if (existing.status !== "pending")
    throw new HTTPException(400, { message: "Deposit request has already been processed" });
  const req = await prisma.depositRequest.update({ where: { id }, data: { status: "rejected", processedBy: user.id } });
  await writeAuditLog(c, {
    action: "deposit_request_rejected",
    entity: "deposit_request",
    entityId: req.id,
  });
  return c.json({ success: true, data: req });
});

export { depositRequests as depositRequestRoutes };
