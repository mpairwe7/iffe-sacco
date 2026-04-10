// @ts-nocheck
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware, requireRole } from "../middleware/auth";
import { writeAuditLog } from "../utils/audit";
import { paymentGatewayService } from "../services/payment-gateway.service";
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

// GET / — list all gateways (secrets redacted)
paymentGateways.get("/", async (c) => {
  const data = await paymentGatewayService.list();
  return c.json({ success: true, data });
});

// GET /:id — get single (secrets redacted unless admin + ?withSecrets=1)
paymentGateways.get("/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  const wantsSecrets = c.req.query("withSecrets") === "1" && user.role === "admin";
  const gateway = await paymentGatewayService.get(id, { includeSecrets: wantsSecrets });
  if (!gateway) return c.json({ success: false, message: "Payment gateway not found" }, 404);
  if (wantsSecrets) {
    await writeAuditLog(c, {
      action: "payment_gateway_secrets_viewed",
      entity: "payment_gateway",
      entityId: id,
      details: { sensitive: true },
    });
  }
  return c.json({ success: true, data: gateway });
});

// POST / — create (admin only)
paymentGateways.post("/", requireRole("admin"), zValidator("json", createSchema), async (c) => {
  const data = c.req.valid("json");
  const gateway = await paymentGatewayService.create(data);
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
  const existing = await paymentGatewayService.get(id);
  if (!existing) return c.json({ success: false, message: "Payment gateway not found" }, 404);
  const gateway = await paymentGatewayService.update(id, data);
  await writeAuditLog(c, {
    action: "payment_gateway_updated",
    entity: "payment_gateway",
    entityId: gateway!.id,
    details: { fieldsChanged: Object.keys(data), configChanged: "config" in data },
  });
  return c.json({ success: true, data: gateway });
});

// PATCH /:id/toggle — toggle active status (admin only)
paymentGateways.patch("/:id/toggle", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const gateway = await paymentGatewayService.toggle(id);
  if (!gateway) return c.json({ success: false, message: "Payment gateway not found" }, 404);
  await writeAuditLog(c, {
    action: "payment_gateway_toggled",
    entity: "payment_gateway",
    entityId: gateway.id,
    details: { isActive: gateway.isActive },
  });
  return c.json({ success: true, data: gateway });
});

export { paymentGateways as paymentGatewayRoutes };
