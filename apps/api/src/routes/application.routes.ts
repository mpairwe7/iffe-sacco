// @ts-nocheck
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createApplicationSchema, reviewApplicationSchema, paginationSchema } from "@iffe/shared";
import { ApplicationService } from "../services/application.service";
import { authMiddleware, requireRole } from "../middleware/auth";

const applications = new Hono();
const service = new ApplicationService();

// Public: submit application (no auth required for initial submission)
applications.post("/", zValidator("json", createApplicationSchema), async (c) => {
  const data = c.req.valid("json");
  const result = await service.submit(data);
  return c.json({ success: true, data: result }, 201);
});

// Authenticated: submit application with user link
applications.post("/authenticated", authMiddleware, zValidator("json", createApplicationSchema), async (c) => {
  const data = c.req.valid("json");
  const user = c.get("user" as any);
  const result = await service.submit(data, user.id);
  return c.json({ success: true, data: result }, 201);
});

// Applicant: check own application status
applications.get("/mine", authMiddleware, async (c) => {
  const user = c.get("user" as any);
  const app = await service.getByUserId(user.id);
  if (!app) return c.json({ success: true, data: null });
  return c.json({ success: true, data: app });
});

// Admin: list all applications
applications.get("/", authMiddleware, requireRole("admin", "staff"), zValidator("query", paginationSchema), async (c) => {
  const params = c.req.valid("query");
  const status = c.req.query("status");
  const result = await service.getAll({ ...params, status });
  return c.json({ success: true, data: result });
});

// Admin: get stats
applications.get("/stats", authMiddleware, requireRole("admin", "staff"), async (c) => {
  const stats = await service.getStats();
  return c.json({ success: true, data: stats });
});

// Admin: view single application
applications.get("/:id", authMiddleware, requireRole("admin", "staff"), async (c) => {
  const app = await service.getById(c.req.param("id"));
  return c.json({ success: true, data: app });
});

// Admin: approve application
applications.put("/:id/approve", authMiddleware, requireRole("admin"), async (c) => {
  const user = c.get("user" as any);
  const result = await service.approve(c.req.param("id"), user.id);
  return c.json({ success: true, data: result });
});

// Admin: reject application
applications.put("/:id/reject", authMiddleware, requireRole("admin"), zValidator("json", reviewApplicationSchema), async (c) => {
  const user = c.get("user" as any);
  const { rejectionReason } = c.req.valid("json");
  const result = await service.reject(c.req.param("id"), user.id, rejectionReason);
  return c.json({ success: true, data: result });
});

export { applications as applicationRoutes };
