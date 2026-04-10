/**
 * Anomaly inbox — admin-only review queue for fraud-scored events.
 *
 * The scoring service writes an AnomalyAlert row for every transaction
 * that scores above the REVIEW threshold. Admins triage here and mark
 * each alert as legit or fraud, which updates the member's risk
 * profile and either allows the underlying workflow to proceed or
 * blocks it with a human note.
 */
// @ts-nocheck
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod/v4";
import { authMiddleware, requireRole } from "../middleware/auth";
import { prisma } from "../config/db";
import { writeAuditLog } from "../utils/audit";

const inbox = new Hono();
inbox.use("*", authMiddleware);
inbox.use("*", requireRole("admin", "chairman"));

inbox.get("/", async (c) => {
  const status = c.req.query("status") || "open";
  const where: any = status === "all" ? {} : { status };
  const [items, counts] = await Promise.all([
    prisma.anomalyAlert.findMany({
      where,
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.anomalyAlert.groupBy({ by: ["status"], _count: true }),
  ]);
  return c.json({
    success: true,
    data: {
      items,
      counts: counts.reduce<Record<string, number>>(
        (acc, row) => ({ ...acc, [row.status]: row._count }),
        {},
      ),
    },
  });
});

inbox.get("/:id", async (c) => {
  const id = c.req.param("id");
  const alert = await prisma.anomalyAlert.findUnique({ where: { id } });
  if (!alert) return c.json({ success: false, message: "Not found" }, 404);
  return c.json({ success: true, data: alert });
});

const resolveSchema = z.object({
  resolution: z.enum(["resolved_legit", "resolved_fraud"]),
  note: z.string().min(10).max(2000),
});

inbox.post("/:id/resolve", zValidator("json", resolveSchema), async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const { resolution, note } = c.req.valid("json");

  const alert = await prisma.anomalyAlert.update({
    where: { id },
    data: {
      status: resolution,
      reviewedBy: user.id,
      reviewedAt: new Date(),
      resolutionNote: note,
    },
  });

  await writeAuditLog(c, {
    action: "anomaly_alert_resolved",
    entity: "anomaly_alert",
    entityId: id,
    details: { resolution, note: note.slice(0, 200) },
  });

  return c.json({ success: true, data: alert });
});

inbox.post("/:id/reviewing", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  await prisma.anomalyAlert.update({
    where: { id },
    data: { status: "reviewing", reviewedBy: user.id },
  });
  return c.json({ success: true });
});

export { inbox as anomalyInboxRoutes };
