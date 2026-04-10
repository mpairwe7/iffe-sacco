import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createLoanSchema, memberLoanApplicationSchema, paginationSchema } from "@iffe/shared";
import { LoanService } from "../services/loan.service";
import { authMiddleware, requireRole, type AuthEnv } from "../middleware/auth";
import { writeAuditLog } from "../utils/audit";
import { z } from "zod/v4";

const loans = new Hono<AuthEnv>();
const service = new LoanService();

loans.use("*", authMiddleware);

loans.get("/", zValidator("query", paginationSchema), async (c) => {
  const params = c.req.valid("query");
  const status = c.req.query("status");
  const user = c.get("user");

  // Members can only see their own loans
  const memberId = user.role === "member" ? (user.memberId ?? undefined) : c.req.query("memberId");

  const result = await service.getAll({ ...params, status, memberId });
  return c.json({ success: true, data: result });
});

loans.get("/stats", async (c) => {
  const user = c.get("user");
  if (user.role === "member") {
    return c.json({ success: false, message: "Insufficient permissions" }, 403);
  }
  const stats = await service.getStats();
  return c.json({ success: true, data: stats });
});

loans.get("/:id", async (c) => {
  const loan = await service.getById(c.req.param("id"));
  const user = c.get("user");

  // Members can only view their own loans
  if (user.role === "member" && loan.memberId !== user.memberId) {
    return c.json({ success: false, message: "Insufficient permissions" }, 403);
  }

  return c.json({ success: true, data: loan });
});

loans.post("/", requireRole("admin", "staff"), zValidator("json", createLoanSchema), async (c) => {
  const data = c.req.valid("json");
  const loan = await service.create(data);
  await writeAuditLog(c, {
    action: "loan_created",
    entity: "loan",
    entityId: loan.id,
    details: { memberId: loan.memberId, amount: loan.amount },
  });
  return c.json({ success: true, data: loan }, 201);
});

loans.post("/apply", requireRole("member"), zValidator("json", memberLoanApplicationSchema), async (c) => {
  const data = c.req.valid("json");
  const user = c.get("user");

  if (!user.memberId) {
    return c.json({ success: false, message: "Member profile not found" }, 404);
  }

  const loan = await service.applyForMember(user.memberId, data);
  await writeAuditLog(c, {
    action: "loan_applied",
    entity: "loan",
    entityId: loan.id,
    details: { amount: loan.amount, type: loan.type },
  });
  return c.json({ success: true, data: loan }, 201);
});

loans.patch("/:id/approve", requireRole("admin"), async (c) => {
  const user = c.get("user");
  const loan = await service.approve(c.req.param("id"), user.id);
  await writeAuditLog(c, {
    action: "loan_approved",
    entity: "loan",
    entityId: loan.id,
  });
  return c.json({ success: true, data: loan });
});

loans.patch("/:id/reject", requireRole("admin"), async (c) => {
  const loan = await service.reject(c.req.param("id"));
  await writeAuditLog(c, {
    action: "loan_rejected",
    entity: "loan",
    entityId: loan.id,
  });
  return c.json({ success: true, data: loan });
});

const repaySchema = z.object({
  amount: z.number().min(1, "Amount must be positive"),
  accountId: z.string().uuid().optional(),
});

loans.patch("/:id/repay", requireRole("admin", "staff"), zValidator("json", repaySchema), async (c) => {
  const { amount, accountId } = c.req.valid("json");
  const user = c.get("user");
  const loan = await service.recordRepayment(c.req.param("id"), amount, user.id, accountId);
  await writeAuditLog(c, {
    action: "loan_repayment_recorded",
    entity: "loan",
    entityId: loan.id,
    details: { amount, accountId: accountId || null },
  });
  return c.json({ success: true, data: loan });
});

export { loans as loanRoutes };
