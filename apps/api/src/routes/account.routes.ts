import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createAccountSchema, updateAccountStatusSchema, paginationSchema } from "@iffe/shared";
import { AccountService } from "../services/account.service";
import { authMiddleware, requireRole, type AuthEnv } from "../middleware/auth";
import { writeAuditLog } from "../utils/audit";

const accounts = new Hono<AuthEnv>();
const service = new AccountService();

accounts.use("*", authMiddleware);

accounts.get("/", zValidator("query", paginationSchema), async (c) => {
  const params = c.req.valid("query");
  const type = c.req.query("type");
  const status = c.req.query("status");
  const user = c.get("user");

  // Members can only see their own accounts
  const memberId = user.role === "member" ? (user.memberId ?? undefined) : c.req.query("memberId");

  const result = await service.getAll({ ...params, type, status, memberId });
  return c.json({ success: true, data: result });
});

accounts.get("/stats", async (c) => {
  const user = c.get("user");
  if (user.role === "member") {
    return c.json({ success: false, message: "Insufficient permissions" }, 403);
  }
  const stats = await service.getStats();
  return c.json({ success: true, data: stats });
});

accounts.get("/:id", async (c) => {
  const account = await service.getById(c.req.param("id"));
  const user = c.get("user");

  // Members can only view their own accounts
  if (user.role === "member" && account.memberId !== user.memberId) {
    return c.json({ success: false, message: "Insufficient permissions" }, 403);
  }

  return c.json({ success: true, data: account });
});

accounts.post("/", requireRole("admin", "staff"), zValidator("json", createAccountSchema), async (c) => {
  const data = c.req.valid("json");
  const account = await service.create(data);
  await writeAuditLog(c, {
    action: "account_created",
    entity: "account",
    entityId: account.id,
    details: { accountNo: account.accountNo, type: account.type },
  });
  return c.json({ success: true, data: account }, 201);
});

accounts.patch("/:id/status", requireRole("admin"), zValidator("json", updateAccountStatusSchema), async (c) => {
  const { status } = c.req.valid("json");
  const account = await service.updateStatus(c.req.param("id"), status);
  await writeAuditLog(c, {
    action: "account_status_updated",
    entity: "account",
    entityId: account.id,
    details: { status: account.status },
  });
  return c.json({ success: true, data: account });
});

export { accounts as accountRoutes };
