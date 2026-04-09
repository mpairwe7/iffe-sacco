import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { paginationSchema } from "@iffe/shared";
import { prisma } from "../config/db";
import { authMiddleware, requireRole } from "../middleware/auth";
import { writeAuditLog } from "../utils/audit";
import { z } from "zod/v4";

const paymentGateways = new Hono();
paymentGateways.use("*", authMiddleware);

const createSchema = z.object({
  name: z.string().min(1, "Name required"),
  type: z.string().min(1, "Type required"),
  currency: z.string().default("UGX"),
  fee: z.string().default("0%"),
  isActive: z.boolean().default(false),
  config: z.record(z.string(), z.unknown()).optional(),
});

const updateSchema = createSchema.partial();

// GET / — list all gateways
paymentGateways.get("/", async (c) => {
  const data = await prisma.paymentGateway.findMany({ orderBy: { name: "asc" } });
  return c.json({ success: true, data });
});

// GET /:id — get single
paymentGateways.get("/:id", async (c) => {
  const id = c.req.param("id");
  const gateway = await prisma.paymentGateway.findUnique({ where: { id } });
  if (!gateway) return c.json({ success: false, message: "Payment gateway not found" }, 404);
  return c.json({ success: true, data: gateway });
});

// POST / — create (admin only)
paymentGateways.post("/", requireRole("admin"), zValidator("json", createSchema), async (c) => {
  const data = c.req.valid("json");
  const gateway = await prisma.paymentGateway.create({ data: data as any });
  await writeAuditLog(c, {
    action: "payment_gateway_created",
    entity: "payment_gateway",
    entityId: gateway.id,
    details: { name: gateway.name, isActive: gateway.isActive },
  });
  return c.json({ success: true, data: gateway }, 201);
});

// PUT /:id — update (admin only)
paymentGateways.put("/:id", requireRole("admin"), zValidator("json", updateSchema), async (c) => {
  const id = c.req.param("id");
  const data = c.req.valid("json");
  const existing = await prisma.paymentGateway.findUnique({ where: { id } });
  if (!existing) return c.json({ success: false, message: "Payment gateway not found" }, 404);
  const gateway = await prisma.paymentGateway.update({ where: { id }, data: data as any });
  await writeAuditLog(c, {
    action: "payment_gateway_updated",
    entity: "payment_gateway",
    entityId: gateway.id,
  });
  return c.json({ success: true, data: gateway });
});

// PATCH /:id/toggle — toggle active status (admin only)
paymentGateways.patch("/:id/toggle", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const existing = await prisma.paymentGateway.findUnique({ where: { id } });
  if (!existing) return c.json({ success: false, message: "Payment gateway not found" }, 404);
  const gateway = await prisma.paymentGateway.update({ where: { id }, data: { isActive: !existing.isActive } });
  await writeAuditLog(c, {
    action: "payment_gateway_toggled",
    entity: "payment_gateway",
    entityId: gateway.id,
    details: { isActive: gateway.isActive },
  });
  return c.json({ success: true, data: gateway });
});

export { paymentGateways as paymentGatewayRoutes };
