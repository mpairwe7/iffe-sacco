/**
 * Notification endpoints — push subscriptions, preferences, and the
 * in-app bell inbox.
 */
// @ts-nocheck
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod/v4";
import { authMiddleware, type AuthEnv } from "../middleware/auth";
import { prisma } from "../config/db";

const notifications = new Hono<AuthEnv>();
notifications.use("*", authMiddleware);

// ===== Subscriptions =====

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  userAgent: z.string().optional(),
});

notifications.post("/subscribe", zValidator("json", subscribeSchema), async (c) => {
  const user = c.get("user");
  const data = c.req.valid("json");

  const sub = await prisma.pushSubscription.upsert({
    where: { endpoint: data.endpoint },
    create: {
      userId: user.id,
      endpoint: data.endpoint,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
      userAgent: data.userAgent,
    },
    update: {
      userId: user.id,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
      userAgent: data.userAgent,
      lastSeenAt: new Date(),
    },
  });

  return c.json({ success: true, data: { id: sub.id } }, 201);
});

notifications.delete("/subscribe", async (c) => {
  const user = c.get("user");
  const endpoint = c.req.query("endpoint");
  if (!endpoint) return c.json({ success: false, message: "endpoint query required" }, 400);
  await prisma.pushSubscription.deleteMany({ where: { userId: user.id, endpoint } });
  return c.json({ success: true });
});

// ===== Preferences =====

const prefsSchema = z.object({
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  notifyTransactionPosted: z.boolean().optional(),
  notifyLoanPaymentDue: z.boolean().optional(),
  notifyLoanApproved: z.boolean().optional(),
  notifySecurityAlert: z.boolean().optional(),
  notifyWelfareUpdate: z.boolean().optional(),
  notifyAssistantMessage: z.boolean().optional(),
});

notifications.get("/preferences", async (c) => {
  const user = c.get("user");
  const prefs = await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, updatedAt: new Date() },
    update: {},
  });
  return c.json({ success: true, data: prefs });
});

notifications.put("/preferences", zValidator("json", prefsSchema), async (c) => {
  const user = c.get("user");
  const data = c.req.valid("json");
  const prefs = await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data, updatedAt: new Date() },
    update: { ...data, updatedAt: new Date() },
  });
  return c.json({ success: true, data: prefs });
});

// ===== Bell inbox =====

notifications.get("/", async (c) => {
  const user = c.get("user");
  const unreadOnly = c.req.query("unread") === "1";
  const list = await prisma.notification.findMany({
    where: { userId: user.id, ...(unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });
  return c.json({ success: true, data: { list, unreadCount } });
});

notifications.post("/:id/read", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  await prisma.notification.updateMany({
    where: { id, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  return c.json({ success: true });
});

notifications.post("/read-all", async (c) => {
  const user = c.get("user");
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  return c.json({ success: true });
});

// VAPID public key for the client subscribe call.
notifications.get("/vapid-public-key", (c) => {
  const key = process.env.VAPID_PUBLIC_KEY || "";
  return c.json({ success: true, data: { publicKey: key } });
});

export { notifications as notificationRoutes };
