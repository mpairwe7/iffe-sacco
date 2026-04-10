/**
 * Email service — Resend scaffold.
 *
 * When RESEND_API_KEY is set, sends via Resend. Otherwise logs the email
 * contents to the structured logger (dev/test behaviour). Templates are
 * defined here for type-safety and testability; swap to @react-email/components
 * when the design team delivers branded templates.
 */
// @ts-nocheck
import { logger } from "../utils/logger";
import { env } from "../config/env";

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "IFFE SACCO <no-reply@sacco.example.org>";

  if (!apiKey) {
    logger.warn(
      { event: "email.stub", to: message.to, subject: message.subject },
      "RESEND_API_KEY unset — email not sent (stub). In production set the env var to activate Resend.",
    );
    logger.debug({ event: "email.stub.body", ...message });
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logger.error(
      { event: "email.send_failed", status: res.status, body: body.slice(0, 500) },
      "Resend API rejected email",
    );
    throw new Error(`Failed to send email: ${res.status} ${res.statusText}`);
  }

  logger.info({ event: "email.sent", to: message.to, subject: message.subject }, "email sent");
}

// ===== Templates =====

export function passwordResetEmail(params: { name: string; resetUrl: string; expiresAt: Date }): EmailMessage {
  const expiresIn = Math.round((params.expiresAt.getTime() - Date.now()) / 60000);
  const safeUrl = params.resetUrl;
  return {
    to: "", // filled in by caller
    subject: "IFFE SACCO — Reset your password",
    text: [
      `Hello ${params.name},`,
      "",
      "You (or someone using your email address) requested a password reset.",
      `Click the link below within ${expiresIn} minutes to choose a new password:`,
      safeUrl,
      "",
      "If you did not make this request, you can safely ignore this email.",
      "",
      "— IFFE SACCO Team",
    ].join("\n"),
    html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Reset your IFFE SACCO password</h2>
        <p>Hello ${escapeHtml(params.name)},</p>
        <p>You (or someone using your email address) requested a password reset.</p>
        <p>
          <a href="${safeUrl}" style="display:inline-block; padding:12px 20px; background:#006622; color:#fff; border-radius:6px; text-decoration:none;">
            Choose a new password
          </a>
        </p>
        <p style="color:#666; font-size:14px;">
          This link expires in ${expiresIn} minutes. If you did not request this, ignore this email.
        </p>
      </div>
    `,
  };
}

export function applicationApprovedEmail(params: { name: string; memberId: string; loginUrl: string }): EmailMessage {
  return {
    to: "",
    subject: "Welcome to IFFE SACCO — your application has been approved",
    text: [
      `Hello ${params.name},`,
      "",
      "Great news — your membership application has been approved.",
      `Your member ID is: ${params.memberId}`,
      `Log in to your portal: ${params.loginUrl}`,
      "",
      "— IFFE SACCO Team",
    ].join("\n"),
    html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Welcome to IFFE SACCO</h2>
        <p>Hello ${escapeHtml(params.name)},</p>
        <p>Great news — your membership application has been approved.</p>
        <p><strong>Member ID:</strong> ${escapeHtml(params.memberId)}</p>
        <p><a href="${params.loginUrl}">Open your member portal</a></p>
      </div>
    `,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
