import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createTransactionSchema, paginationSchema } from "../../../shared/src";
import { TransactionService } from "../services/transaction.service";
import { authMiddleware, requireRole } from "../middleware/auth";

const transactions = new Hono();
const service = new TransactionService();

transactions.use("*", authMiddleware);

transactions.get("/", zValidator("query", paginationSchema), async (c) => {
  const params = c.req.valid("query");
  const type = c.req.query("type");
  const status = c.req.query("status");
  const accountId = c.req.query("accountId");
  const result = await service.getAll({ ...params, type, status, accountId });
  return c.json({ success: true, data: result });
});

transactions.get("/stats", async (c) => {
  const stats = await service.getStats();
  return c.json({ success: true, data: stats });
});

transactions.get("/:id", async (c) => {
  const txn = await service.getById(c.req.param("id"));
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
