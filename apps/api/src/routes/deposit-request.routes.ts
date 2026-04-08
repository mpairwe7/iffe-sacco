import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { paginationSchema } from "@iffe/shared";
import { prisma } from "../config/db";
import { authMiddleware, requireRole } from "../middleware/auth";
import { z } from "zod/v4";

const depositRequests = new Hono();
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

  const where: any = {};
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
      include: { account: { include: { member: true } } },
    }),
    prisma.depositRequest.count({ where }),
  ]);
  return c.json({ success: true, data: { data, total, page, limit, totalPages: Math.ceil(total / limit) } });
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
  return c.json({ success: true, data: req }, 201);
});

depositRequests.patch("/:id/approve", requireRole("admin", "staff"), async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  const result = await prisma.$transaction(async (tx: any) => {
    const existing = await tx.depositRequest.findUnique({ where: { id } });
    if (!existing) throw new HTTPException(404, { message: "Deposit request not found" });
    if (existing.status !== "pending") throw new HTTPException(400, { message: "Deposit request has already been processed" });

    const req = await tx.depositRequest.update({
      where: { id },
      data: { status: "approved", processedBy: user.id },
    });

    // Create corresponding transaction
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

    // Update account balance
    await tx.account.update({
      where: { id: req.accountId },
      data: { balance: { increment: req.amount }, lastActivity: new Date() },
    });

    return req;
  });

  return c.json({ success: true, data: result });
});

depositRequests.patch("/:id/reject", requireRole("admin", "staff"), async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const existing = await prisma.depositRequest.findUnique({ where: { id } });
  if (!existing) throw new HTTPException(404, { message: "Deposit request not found" });
  if (existing.status !== "pending") throw new HTTPException(400, { message: "Deposit request has already been processed" });
  const req = await prisma.depositRequest.update({ where: { id }, data: { status: "rejected", processedBy: user.id } });
  return c.json({ success: true, data: req });
});

export { depositRequests as depositRequestRoutes };
