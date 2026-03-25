import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createLoanSchema, paginationSchema } from "../../../shared/src";
import { LoanService } from "../services/loan.service";
import { authMiddleware, requireRole } from "../middleware/auth";
import { z } from "zod/v4";

const loans = new Hono();
const service = new LoanService();

loans.use("*", authMiddleware);

loans.get("/", zValidator("query", paginationSchema), async (c) => {
  const params = c.req.valid("query");
  const status = c.req.query("status");
  const memberId = c.req.query("memberId");
  const result = await service.getAll({ ...params, status, memberId });
  return c.json({ success: true, data: result });
});

loans.get("/stats", async (c) => {
  const stats = await service.getStats();
  return c.json({ success: true, data: stats });
});

loans.get("/:id", async (c) => {
  const loan = await service.getById(c.req.param("id"));
  return c.json({ success: true, data: loan });
});

loans.post("/", requireRole("admin", "staff"), zValidator("json", createLoanSchema), async (c) => {
  const data = c.req.valid("json");
  const loan = await service.create(data);
  return c.json({ success: true, data: loan }, 201);
});

loans.patch("/:id/approve", requireRole("admin"), async (c) => {
  const user = c.get("user");
  const loan = await service.approve(c.req.param("id"), user.id);
  return c.json({ success: true, data: loan });
});

loans.patch("/:id/reject", requireRole("admin"), async (c) => {
  const loan = await service.reject(c.req.param("id"));
  return c.json({ success: true, data: loan });
});

const repaySchema = z.object({
  amount: z.number().min(1, "Amount must be positive"),
});

loans.patch("/:id/repay", requireRole("admin", "staff"), zValidator("json", repaySchema), async (c) => {
  const { amount } = c.req.valid("json");
  const user = c.get("user");
  const loan = await service.recordRepayment(c.req.param("id"), amount, user.id);
  return c.json({ success: true, data: loan });
});

export { loans as loanRoutes };
