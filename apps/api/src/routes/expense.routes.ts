import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createExpenseSchema, updateExpenseSchema, paginationSchema } from "@iffe/shared";
import { ExpenseService } from "../services/expense.service";
import { authMiddleware, requireRole } from "../middleware/auth";
import { writeAuditLog } from "../utils/audit";

const expenses = new Hono();
const service = new ExpenseService();

expenses.use("*", authMiddleware);

expenses.get("/", zValidator("query", paginationSchema), async (c) => {
  const params = c.req.valid("query");
  const category = c.req.query("category");
  const status = c.req.query("status");
  const result = await service.getAll({ ...params, category, status });
  return c.json({ success: true, data: result });
});

expenses.get("/stats", async (c) => {
  const stats = await service.getStats();
  return c.json({ success: true, data: stats });
});

expenses.get("/:id", async (c) => {
  const expense = await service.getById(c.req.param("id"));
  return c.json({ success: true, data: expense });
});

expenses.post("/", requireRole("admin", "staff"), zValidator("json", createExpenseSchema), async (c) => {
  const data = c.req.valid("json");
  const expense = await service.create(data);
  await writeAuditLog(c, {
    action: "expense_created",
    entity: "expense",
    entityId: expense.id,
    details: { amount: expense.amount, category: expense.category },
  });
  return c.json({ success: true, data: expense }, 201);
});

expenses.put("/:id", requireRole("admin", "staff"), zValidator("json", updateExpenseSchema), async (c) => {
  const data = c.req.valid("json");
  const expense = await service.update(c.req.param("id"), data);
  await writeAuditLog(c, {
    action: "expense_updated",
    entity: "expense",
    entityId: expense.id,
  });
  return c.json({ success: true, data: expense });
});

expenses.patch("/:id/approve", requireRole("admin", "chairman"), async (c) => {
  const user = c.get("user");
  const expense = await service.approve(c.req.param("id"), user.id);
  await writeAuditLog(c, {
    action: "expense_approved",
    entity: "expense",
    entityId: expense.id,
  });
  return c.json({ success: true, data: expense });
});

expenses.patch("/:id/reject", requireRole("admin", "chairman"), async (c) => {
  const expense = await service.reject(c.req.param("id"));
  await writeAuditLog(c, {
    action: "expense_rejected",
    entity: "expense",
    entityId: expense.id,
  });
  return c.json({ success: true, data: expense });
});

expenses.delete("/:id", requireRole("admin"), async (c) => {
  await service.delete(c.req.param("id"));
  await writeAuditLog(c, {
    action: "expense_deleted",
    entity: "expense",
    entityId: c.req.param("id"),
  });
  return c.json({ success: true, message: "Expense deleted" });
});

export { expenses as expenseRoutes };
