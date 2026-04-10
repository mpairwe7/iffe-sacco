/**
 * Notification dispatcher.
 *
 * One function, `notify()`, fans out a notification across the channels
 * the recipient has enabled (push, email, in-app). Stores a row in
 * `notifications` for the in-app bell regardless of other channels.
 *
 * Web Push uses the standard VAPID-encrypted `web-push` flow. Keys live
 * in VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY env vars. Generate once with:
 *   npx web-push generate-vapid-keys
 *
 * Email goes through the existing Resend service.
 */
// @ts-nocheck
import { prisma } from "../config/db";
import { logger } from "../utils/logger";
import { sendEmail } from "./email.service";

export type NotificationType =
  | "transaction_posted"
  | "loan_due"
  | "loan_approved"
  | "security"
  | "welfare"
  | "assistant";

export interface NotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  url?: string;
  /** When true, bypass user preference check (security alerts). */
  force?: boolean;
  /** Extra data echoed to the push handler. */
  data?: Record<string, unknown>;
}

const PREF_FIELDS: Record<NotificationType, string> = {
  transaction_posted: "notifyTransactionPosted",
  loan_due: "notifyLoanPaymentDue",
  loan_approved: "notifyLoanApproved",
  security: "notifySecurityAlert",
  welfare: "notifyWelfareUpdate",
  assistant: "notifyAssistantMessage",
};

async function getPrefs(userId: string) {
  const existing = await prisma.notificationPreference.findUnique({ where: { userId } });
  if (existing) return existing;
  // First time: create row with defaults.
  return prisma.notificationPreference.create({
    data: { userId, updatedAt: new Date() },
  });
}

export async function notify(input: NotificationInput): Promise<{ id: string; sentVia: string[] }> {
  const prefs = await getPrefs(input.userId);
  const sentVia: string[] = [];

  const wantsType = input.force || (prefs as any)[PREF_FIELDS[input.type]] !== false;

  // Always record an in-app notification regardless of channel prefs
  // (so the bell icon has a record). Push / email respect prefs.
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      url: input.url,
    },
  });
  sentVia.push("in_app");

  if (!wantsType) {
    logger.info(
      { event: "notification.skipped", userId: input.userId, type: input.type, reason: "prefs" },
      "notification skipped by user preference",
    );
    await prisma.notification.update({
      where: { id: notification.id },
      data: { sentVia },
    });
    return { id: notification.id, sentVia };
  }

  if (prefs.pushEnabled || input.force) {
    const delivered = await sendPush(input.userId, {
      title: input.title,
      body: input.body,
      url: input.url,
      data: input.data,
    });
    if (delivered > 0) sentVia.push("push");
  }

  if (prefs.emailEnabled || input.force) {
    try {
      const email = await userEmail(input.userId);
      if (email) {
        await sendEmail({
          to: email,
          subject: input.title,
          text: input.body + (input.url ? `\n\n${input.url}` : ""),
          html: `<p>${escapeHtml(input.body)}</p>${input.url ? `<p><a href="${input.url}">Open</a></p>` : ""}`,
        });
        sentVia.push("email");
      }
    } catch (err) {
      logger.warn(
        { event: "notification.email_failed", err: err instanceof Error ? err.message : String(err) },
        "email channel failed",
      );
    }
  }

  await prisma.notification.update({
    where: { id: notification.id },
    data: { sentVia },
  });

  return { id: notification.id, sentVia };
}

async function userEmail(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return user?.email ?? null;
}

async function sendPush(
  userId: string,
  payload: { title: string; body: string; url?: string; data?: Record<string, unknown> },
): Promise<number> {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return 0;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@sacco.example.org";

  if (!publicKey || !privateKey) {
    logger.warn({ event: "push.unconfigured" }, "VAPID keys unset — skipping push (notification still stored in DB)");
    return 0;
  }

  let delivered = 0;
  try {
    const webpush = await import("web-push");
    webpush.default.setVapidDetails(subject, publicKey, privateKey);

    const body = JSON.stringify(payload);
    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.default.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            body,
          );
          delivered += 1;
        } catch (err: any) {
          // 410/404 → subscription is dead, clean it up.
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
          } else {
            logger.warn({ event: "push.send_failed", subId: sub.id, err: err?.message }, "web push delivery failed");
          }
        }
      }),
    );
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "web-push dependency unavailable");
  }

  return delivered;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
