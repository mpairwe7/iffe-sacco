import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { paginationSchema } from "../../../shared/src";
import { prisma } from "../config/db";
import { authMiddleware, requireRole } from "../middleware/auth";
import { z } from "zod/v4";

const withdrawRequests = new Hono();
withdrawRequests.use("*", authMiddleware);

const createSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number().min(1000, "Minimum withdrawal is 1,000"),
  method: z.string().default("cash"),
  reason: z.string().optional(),
});

withdrawRequests.get("/", zValidator("query", paginationSchema), async (c) => {
  const { page = 1, limit = 20, search, sortOrder = "desc" } = c.req.valid("query");
  const user = c.get("user");
  const where: any = {};
  // Members see only their own requests
  if (user.role === "member") {
    const member = await prisma.member.findFirst({ where: { userId: user.id } });
    if (member) where.memberId = member.id;
  }
  if (search) where.OR = [{ reason: { contains: search, mode: "insensitive" } }];
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.withdrawRequest.findMany({ where, skip, take: limit, orderBy: { createdAt: sortOrder } }),
    prisma.withdrawRequest.count({ where }),
  ]);
  return c.json({ success: true, data: { data, total, page, limit, totalPages: Math.ceil(total / limit) } });
});

withdrawRequests.post("/", zValidator("json", createSchema), async (c) => {
  const data = c.req.valid("json");
  const user = c.get("user");

  // Validate sufficient balance before creating request
  const account = await prisma.account.findUnique({ where: { id: data.accountId } });
  if (!account) return c.json({ success: false, message: "Account not found" }, 404);
  if (account.status !== "active") return c.json({ success: false, message: "Account is not active" }, 400);
  if (Number(account.balance) < data.amount) return c.json({ success: false, message: "Insufficient balance" }, 400);

  const member = await prisma.member.findFirst({ where: { userId: user.id } });
  const memberId = member?.id || "";
  const req = await prisma.withdrawRequest.create({ data: { ...data, memberId } });
  return c.json({ success: true, data: req }, 201);
});

withdrawRequests.patch("/:id/approve", requireRole("admin", "staff"), async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  const result = await prisma.$transaction(async (tx) => {
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
  const req = await prisma.withdrawRequest.update({ where: { id }, data: { status: "rejected", processedBy: user.id } });
  return c.json({ success: true, data: req });
});

export { withdrawRequests as withdrawRequestRoutes };
