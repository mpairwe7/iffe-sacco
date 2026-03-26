import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createAccountSchema, updateAccountStatusSchema, paginationSchema } from "@iffe/shared";
import { AccountService } from "../services/account.service";
import { authMiddleware, requireRole } from "../middleware/auth";

const accounts = new Hono();
const service = new AccountService();

accounts.use("*", authMiddleware);

accounts.get("/", zValidator("query", paginationSchema), async (c) => {
  const params = c.req.valid("query");
  const type = c.req.query("type");
  const status = c.req.query("status");
  const memberId = c.req.query("memberId");
  const result = await service.getAll({ ...params, type, status, memberId });
  return c.json({ success: true, data: result });
});

accounts.get("/stats", async (c) => {
  const stats = await service.getStats();
  return c.json({ success: true, data: stats });
});

accounts.get("/:id", async (c) => {
  const account = await service.getById(c.req.param("id"));
  return c.json({ success: true, data: account });
});

accounts.post("/", requireRole("admin", "staff"), zValidator("json", createAccountSchema), async (c) => {
  const data = c.req.valid("json");
  const account = await service.create(data);
  return c.json({ success: true, data: account }, 201);
});

accounts.patch("/:id/status", requireRole("admin"), zValidator("json", updateAccountStatusSchema), async (c) => {
  const { status } = c.req.valid("json");
  const account = await service.updateStatus(c.req.param("id"), status);
  return c.json({ success: true, data: account });
});

export { accounts as accountRoutes };
