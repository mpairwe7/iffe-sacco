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
import { withdrawWorkflow } from "../workflows/withdraw.workflow";
import { z } from "zod/v4";

const withdrawRequests = new Hono<AuthEnv>();
withdrawRequests.use("*", authMiddleware);

const createSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number().min(5000, "Minimum withdrawal is 5,000").max(5000000, "Maximum daily withdrawal is 5,000,000"),
  method: z.string().default("cash"),
  reason: z.string().optional(),
});

withdrawRequests.get("/", zValidator("query", paginationSchema), async (c) => {
  const { page = 1, limit = 20, search, sortOrder = "desc" } = c.req.valid("query");
  const user = c.get("user");
  if (!["admin", "staff", "member"].includes(user.role)) {
    throw new HTTPException(403, { message: "Insufficient permissions" });
  }

  const where: Prisma.WithdrawRequestWhereInput = {};
  if (user.role === "member" && user.memberId) {
    where.memberId = user.memberId;
  }
  if (search) where.OR = [{ reason: { contains: search, mode: "insensitive" } }];
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.withdrawRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: sortOrder },
    }),
    prisma.withdrawRequest.count({ where }),
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

withdrawRequests.post("/", requireRole("member"), zValidator("json", createSchema), async (c) => {
  const data = c.req.valid("json");
  const user = c.get("user");
  if (!user.memberId) {
    throw new HTTPException(403, { message: "Only members can create withdrawal requests" });
  }

  const account = await prisma.account.findFirst({
    where: { id: data.accountId, memberId: user.memberId },
  });
  if (!account) throw new HTTPException(404, { message: "Account not found" });
  if (account.status !== "active") throw new HTTPException(400, { message: "Account is not active" });
  if (Number(account.balance) < data.amount) throw new HTTPException(400, { message: "Insufficient balance" });

  const req = await prisma.withdrawRequest.create({ data: { ...data, memberId: user.memberId } });
  await writeAuditLog(c, {
    action: "withdraw_request_created",
    entity: "withdraw_request",
    entityId: req.id,
    details: { amount: req.amount },
  });
  return c.json({ success: true, data: req }, 201);
});

withdrawRequests.patch("/:id/approve", requireRole("admin", "staff"), async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  // Step 1 — validate + sufficient-balance pre-check outside any
  // transaction so a clean 400 comes back before any workflow run
  // row is opened. The workflow also performs the balance check
  // atomically inside its step.
  const existing = await prisma.withdrawRequest.findUnique({ where: { id } });
  if (!existing) throw new HTTPException(404, { message: "Withdrawal request not found" });
  if (existing.status !== "pending") {
    throw new HTTPException(400, { message: "Withdrawal request has already been processed" });
  }

  const account = await prisma.account.findUnique({ where: { id: existing.accountId } });
  if (!account || Number(account.balance) < Number(existing.amount)) {
    throw new HTTPException(400, { message: "Insufficient balance" });
  }

  let result: typeof existing;

  if (flags.ledgerEnabled) {
    // Phase 10 path: route through the withdraw workflow so the
    // ledger gets a balanced Dr member-liability / Cr cash entry
    // alongside the projection. Workflow is idempotent on key.
    logger.info(
      { event: "withdraw_request.approve.workflow", withdrawRequestId: id, amount: existing.amount },
      "approving withdrawal request via ledger workflow",
    );
    await runWorkflow(withdrawWorkflow, {
      idempotencyKey: `withdraw-request:${id}`,
      startedBy: user.id,
      input: {
        memberAccountId: existing.accountId,
        amount: Money.toString(Money.fromDb(existing.amount)),
        method: existing.method,
        description: existing.reason || "Approved withdrawal request",
        processedBy: user.id,
        destinationOfFunds: mapMethodToLedgerSource(existing.method),
      },
    });

    result = await prisma.withdrawRequest.update({
      where: { id },
      data: { status: "approved", processedBy: user.id },
    });
  } else {
    logger.warn(
      { event: "withdraw_request.approve.legacy", withdrawRequestId: id },
      "approving withdrawal request via legacy direct-balance path (LEDGER_ENABLED=false)",
    );
    result = await withTx(async (tx: Prisma.TransactionClient) => {
      const req = await tx.withdrawRequest.update({
        where: { id },
        data: { status: "approved", processedBy: user.id },
      });
      // Re-check inside the tx in case the balance moved since the
      // pre-check above.
      const currentAccount = await tx.account.findUnique({ where: { id: req.accountId } });
      if (!currentAccount || Number(currentAccount.balance) < Number(req.amount)) {
        throw new HTTPException(400, { message: "Insufficient balance" });
      }
      await tx.transaction.create({
        data: {
          accountId: req.accountId,
          type: "withdrawal",
          amount: req.amount,
          method: req.method,
          description: req.reason || "Approved withdrawal request",
          status: "completed",
          processedBy: user.id,
        },
      });
      await tx.account.update({
        where: { id: req.accountId },
        data: { balance: { decrement: req.amount }, lastActivity: new Date() },
      });
      return req;
    });
  }

  await writeAuditLog(c, {
    action: "withdraw_request_approved",
    entity: "withdraw_request",
    entityId: result.id,
    details: { ledgerEnabled: flags.ledgerEnabled, amount: result.amount },
  });
  return c.json({ success: true, data: result });
});

withdrawRequests.patch("/:id/reject", requireRole("admin", "staff"), async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const existing = await prisma.withdrawRequest.findUnique({ where: { id } });
  if (!existing) throw new HTTPException(404, { message: "Withdrawal request not found" });
  if (existing.status !== "pending")
    throw new HTTPException(400, { message: "Withdrawal request has already been processed" });
  const req = await prisma.withdrawRequest.update({
    where: { id },
    data: { status: "rejected", processedBy: user.id },
  });
  await writeAuditLog(c, {
    action: "withdraw_request_rejected",
    entity: "withdraw_request",
    entityId: req.id,
  });
  return c.json({ success: true, data: req });
});

export { withdrawRequests as withdrawRequestRoutes };
