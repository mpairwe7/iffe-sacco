import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createWelfareSchema, updateWelfareSchema, pledgeSchema, paginationSchema } from "@iffe/shared";
import { WelfareService } from "../services/welfare.service";
import { authMiddleware, requireRole } from "../middleware/auth";
import { z } from "zod/v4";

const statusSchema = z.object({
  status: z.enum(["active", "completed", "paused"]),
});

const welfare = new Hono();
const service = new WelfareService();

welfare.use("*", authMiddleware);

welfare.get("/", zValidator("query", paginationSchema), async (c) => {
  const params = c.req.valid("query");
  const status = c.req.query("status");
  const result = await service.getAll({ ...params, status });
  return c.json({ success: true, data: result });
});

welfare.get("/stats", async (c) => {
  const stats = await service.getStats();
  return c.json({ success: true, data: stats });
});

welfare.get("/pledges/mine", async (c) => {
  const user = c.get("user");
  const params = { page: 1, limit: 50 };
  const result = await service.getMemberPledges(user.id, params);
  return c.json({ success: true, data: result });
});

welfare.get("/:id", async (c) => {
  const program = await service.getById(c.req.param("id"));
  return c.json({ success: true, data: program });
});

welfare.post("/", requireRole("admin"), zValidator("json", createWelfareSchema), async (c) => {
  const data = c.req.valid("json");
  const program = await service.create(data);
  return c.json({ success: true, data: program }, 201);
});

welfare.put("/:id", requireRole("admin"), zValidator("json", updateWelfareSchema), async (c) => {
  const data = c.req.valid("json");
  const program = await service.update(c.req.param("id"), data);
  return c.json({ success: true, data: program });
});

welfare.patch("/:id/status", requireRole("admin"), zValidator("json", statusSchema), async (c) => {
  const { status } = c.req.valid("json");
  const program = await service.updateStatus(c.req.param("id"), status);
  return c.json({ success: true, data: program });
});

welfare.get("/:id/pledges", zValidator("query", paginationSchema), async (c) => {
  const params = c.req.valid("query");
  const result = await service.getPledges(c.req.param("id"), params);
  return c.json({ success: true, data: result });
});

welfare.post("/pledges", zValidator("json", pledgeSchema), async (c) => {
  const data = c.req.valid("json");
  const user = c.get("user");
  const pledge = await service.createPledge({ ...data, memberId: user.id });
  return c.json({ success: true, data: pledge }, 201);
});

export { welfare as welfareRoutes };
