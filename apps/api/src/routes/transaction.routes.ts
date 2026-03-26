import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createTransactionSchema, paginationSchema } from "@iffe/shared";
import { TransactionService } from "../services/transaction.service";
import { authMiddleware, requireRole } from "../middleware/auth";
import { prisma } from "../config/db";

const transactions = new Hono();
const service = new TransactionService();

transactions.use("*", authMiddleware);

transactions.get("/", zValidator("query", paginationSchema), async (c) => {
  const params = c.req.valid("query");
  const type = c.req.query("type");
  const status = c.req.query("status");
  const user = c.get("user");

  // Members can only see transactions for their own accounts
  if (user.role === "member") {
    const accounts = await prisma.account.findMany({
      where: { memberId: user.memberId! },
      select: { id: true },
    });
    const accountIds = accounts.map((a) => a.id);
    const result = await service.getAll({ ...params, type, status, accountIds });
    return c.json({ success: true, data: result });
  }

  const accountId = c.req.query("accountId");
  const result = await service.getAll({ ...params, type, status, accountId });
  return c.json({ success: true, data: result });
});

transactions.get("/stats", async (c) => {
  const user = c.get("user");
  if (user.role === "member") {
    return c.json({ success: false, message: "Insufficient permissions" }, 403);
  }
  const stats = await service.getStats();
  return c.json({ success: true, data: stats });
});

transactions.get("/:id", async (c) => {
  const txn = await service.getById(c.req.param("id"));
  const user = c.get("user");

  // Members can only view transactions on their own accounts
  if (user.role === "member" && txn.account.memberId !== user.memberId) {
    return c.json({ success: false, message: "Insufficient permissions" }, 403);
  }

  return c.json({ success: true, data: txn });
});

transactions.post("/", requireRole("admin", "staff"), zValidator("json", createTransactionSchema), async (c) => {
  const data = c.req.valid("json");
  const user = c.get("user");
  const txn = await service.create({ ...data, processedBy: user.id });
  return c.json({ success: true, data: txn }, 201);
});

transactions.patch("/:id/approve", requireRole("admin"), async (c) => {
  const user = c.get("user");
  const txn = await service.approve(c.req.param("id"), user.id);
  return c.json({ success: true, data: txn });
});

transactions.patch("/:id/reject", requireRole("admin"), async (c) => {
  const user = c.get("user");
  const txn = await service.reject(c.req.param("id"), user.id);
  return c.json({ success: true, data: txn });
});

transactions.patch("/:id/reverse", requireRole("admin"), async (c) => {
  const user = c.get("user");
  const txn = await service.reverse(c.req.param("id"), user.id);
  return c.json({ success: true, data: txn });
});

export { transactions as transactionRoutes };
