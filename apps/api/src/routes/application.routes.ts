// @ts-nocheck
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  createApplicationSchema,
  reviewApplicationSchema,
  recommendApplicationSchema,
  declineApplicationSchema,
  paginationSchema,
} from "@iffe/shared";
import { ApplicationService } from "../services/application.service";
import { authMiddleware, requireRole } from "../middleware/auth";
import { requireEmptyBody } from "../middleware/empty-body";
import { writeAuditLog } from "../utils/audit";

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
  await writeAuditLog(c, {
    action: "application_submitted",
    entity: "application",
    entityId: result.id,
    details: { status: result.status },
  });
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
applications.get(
  "/",
  authMiddleware,
  requireRole("admin", "staff"),
  zValidator("query", paginationSchema),
  async (c) => {
    const params = c.req.valid("query");
    const status = c.req.query("status");
    const result = await service.getAll({ ...params, status });
    return c.json({ success: true, data: result });
  },
);

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

// Staff: recommend a pending application to the admin for final approval
applications.put(
  "/:id/recommend",
  authMiddleware,
  requireRole("staff"),
  zValidator("json", recommendApplicationSchema),
  async (c) => {
    const user = c.get("user" as any);
    const { notes } = c.req.valid("json");
    const result = await service.recommend(c.req.param("id"), user.id, notes);
    await writeAuditLog(c, {
      action: "application_recommended",
      entity: "application",
      entityId: c.req.param("id"),
      details: { notes: notes || null },
    });
    return c.json({ success: true, data: result });
  },
);

// Staff: decline a pending application (terminal) with a required reason
applications.put(
  "/:id/decline",
  authMiddleware,
  requireRole("staff"),
  zValidator("json", declineApplicationSchema),
  async (c) => {
    const user = c.get("user" as any);
    const { reason } = c.req.valid("json");
    const result = await service.decline(c.req.param("id"), user.id, reason);
    await writeAuditLog(c, {
      action: "application_declined",
      entity: "application",
      entityId: c.req.param("id"),
      details: { reason },
    });
    return c.json({ success: true, data: result });
  },
);

// Admin: approve application (must be staff-recommended first)
applications.put("/:id/approve", authMiddleware, requireRole("admin"), requireEmptyBody, async (c) => {
  const user = c.get("user" as any);
  const result = await service.approve(c.req.param("id"), user.id);
  await writeAuditLog(c, {
    action: "application_approved",
    entity: "application",
    entityId: c.req.param("id"),
    details: {
      memberId: result.member.id,
      onboardingUserId: result.onboarding?.userId,
    },
  });
  return c.json({ success: true, data: result });
});

// Admin: reject application
applications.put(
  "/:id/reject",
  authMiddleware,
  requireRole("admin"),
  zValidator("json", reviewApplicationSchema),
  async (c) => {
    const user = c.get("user" as any);
    const { rejectionReason } = c.req.valid("json");
    const result = await service.reject(c.req.param("id"), user.id, rejectionReason);
    await writeAuditLog(c, {
      action: "application_rejected",
      entity: "application",
      entityId: c.req.param("id"),
      details: { rejectionReason: rejectionReason || null },
    });
    return c.json({ success: true, data: result });
  },
);

export { applications as applicationRoutes };
