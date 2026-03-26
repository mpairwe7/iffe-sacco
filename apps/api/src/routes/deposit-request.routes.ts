import { Hono } from "hono";
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
  const where: any = {};
  // Members see only their own requests
  if (user.role === "member") {
    const member = await prisma.member.findFirst({ where: { userId: user.id } });
    if (member) where.memberId = member.id;
  }
  if (search) where.OR = [{ description: { contains: search, mode: "insensitive" } }];
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.depositRequest.findMany({ where, skip, take: limit, orderBy: { createdAt: sortOrder } }),
    prisma.depositRequest.count({ where }),
  ]);
  return c.json({ success: true, data: { data, total, page, limit, totalPages: Math.ceil(total / limit) } });
});

depositRequests.post("/", zValidator("json", createSchema), async (c) => {
  const data = c.req.valid("json");
  const user = c.get("user");
  const member = await prisma.member.findFirst({ where: { userId: user.id } });
  const memberId = member?.id || "";
  const req = await prisma.depositRequest.create({ data: { ...data, memberId } });
  return c.json({ success: true, data: req }, 201);
});

depositRequests.patch("/:id/approve", requireRole("admin", "staff"), async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");

  const result = await prisma.$transaction(async (tx) => {
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
  const req = await prisma.depositRequest.update({ where: { id }, data: { status: "rejected", processedBy: user.id } });
  return c.json({ success: true, data: req });
});

export { depositRequests as depositRequestRoutes };
