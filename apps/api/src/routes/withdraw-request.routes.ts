import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { paginationSchema } from "@iffe/shared";
import { prisma } from "../config/db";
import { authMiddleware, requireRole } from "../middleware/auth";
import { z } from "zod/v4";

const withdrawRequests = new Hono();
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

  const where: any = {};
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
      include: { account: { include: { member: true } } },
    }),
    prisma.withdrawRequest.count({ where }),
  ]);
  return c.json({ success: true, data: { data, total, page, limit, totalPages: Math.ceil(total / limit) } });
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
  return c.json({ success: true, data: req }, 201);
});

withdrawRequests.patch("/:id/approve", requireRole("admin", "staff"), async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  const result = await prisma.$transaction(async (tx: any) => {
    const existing = await tx.withdrawRequest.findUnique({ where: { id } });
    if (!existing) throw new HTTPException(404, { message: "Withdrawal request not found" });
    if (existing.status !== "pending") throw new HTTPException(400, { message: "Withdrawal request has already been processed" });

    const req = await tx.withdrawRequest.update({
      where: { id },
      data: { status: "approved", processedBy: user.id },
    });

    // Check sufficient balance inside the transaction
    const account = await tx.account.findUnique({ where: { id: req.accountId } });
    if (!account || Number(account.balance) < Number(req.amount)) {
      throw new HTTPException(400, { message: "Insufficient balance" });
    }

    // Create actual withdrawal transaction
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

    // Decrement account balance
    await tx.account.update({
      where: { id: req.accountId },
      data: { balance: { decrement: req.amount }, lastActivity: new Date() },
    });

    return req;
  });

  return c.json({ success: true, data: result });
});

withdrawRequests.patch("/:id/reject", requireRole("admin", "staff"), async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const existing = await prisma.withdrawRequest.findUnique({ where: { id } });
  if (!existing) throw new HTTPException(404, { message: "Withdrawal request not found" });
  if (existing.status !== "pending") throw new HTTPException(400, { message: "Withdrawal request has already been processed" });
  const req = await prisma.withdrawRequest.update({ where: { id }, data: { status: "rejected", processedBy: user.id } });
  return c.json({ success: true, data: req });
});

export { withdrawRequests as withdrawRequestRoutes };
