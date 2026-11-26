/**
 * Email service.
 *
 * Transport precedence: SMTP when SMTP_HOST is set, else Resend when
 * RESEND_API_KEY is set, else log the email contents to the structured logger
 * (dev/test behaviour). Templates are defined here for type-safety and
 * testability; swap to @react-email/components when the design team delivers
 * branded templates.
 */
// @ts-nocheck
import nodemailer from "nodemailer";
import { logger } from "../utils/logger";
import { env } from "../config/env";

const SMTP_SEND_TIMEOUT_MS = 15_000;

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}

async function sendViaSmtp(message: EmailMessage): Promise<void> {
  const port = Number(process.env.SMTP_PORT || 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // implicit TLS on 465; STARTTLS (enforced below) otherwise
    requireTLS: true, // never send credentials or mail over plaintext
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // Phase limits fail fast on unreachable servers; the total send deadline below
    // keeps credential delivery within the route's 30s serverless request limit.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  let sendTimeout: ReturnType<typeof setTimeout> | undefined;
  try {
    // Gmail and most relays rewrite or reject a From that isn't the authenticated account.
    await Promise.race([
      transport.sendMail({
        from: `IFFE Bbenhe <${process.env.SMTP_USER}>`,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
      new Promise<never>((_, reject) => {
        sendTimeout = setTimeout(() => {
          transport.close();
          reject(new Error(`SMTP send exceeded ${SMTP_SEND_TIMEOUT_MS}ms`));
        }, SMTP_SEND_TIMEOUT_MS);
      }),
    ]);
  } catch (err) {
    logger.error(
      { event: "email.send_failed", transport: "smtp", error: (err as Error).message },
      "SMTP server rejected email",
    );
    throw err;
  } finally {
    if (sendTimeout) clearTimeout(sendTimeout);
  }

  logger.info({ event: "email.sent", transport: "smtp", to: message.to, subject: message.subject }, "email sent");
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  if (process.env.SMTP_HOST) return sendViaSmtp(message);

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "IFFE Bbenhe <no-reply@sacco.example.org>";

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
    subject: "IFFE Bbenhe — Reset your password",
    text: [
      `Hello ${params.name},`,
      "",
      "You (or someone using your email address) requested a password reset.",
      `Click the link below within ${expiresIn} minutes to choose a new password:`,
      safeUrl,
      "",
      "If you did not make this request, you can safely ignore this email.",
      "",
      "— IFFE Bbenhe Team",
    ].join("\n"),
    html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Reset your IFFE Bbenhe password</h2>
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
    subject: "Welcome to IFFE Bbenhe — your application has been approved",
    text: [
      `Hello ${params.name},`,
      "",
      "Great news — your membership application has been approved.",
      `Your member ID is: ${params.memberId}`,
      `Log in to your portal: ${params.loginUrl}`,
      "",
      "— IFFE Bbenhe Team",
    ].join("\n"),
    html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Welcome to IFFE Bbenhe</h2>
        <p>Hello ${escapeHtml(params.name)},</p>
        <p>Great news — your membership application has been approved.</p>
        <p><strong>Member ID:</strong> ${escapeHtml(params.memberId)}</p>
        <p><a href="${params.loginUrl}">Open your member portal</a></p>
      </div>
    `,
  };
}

export function memberCredentialsEmail(params: {
  name: string;
  loginEmail: string;
  tempPassword: string;
  loginUrl: string;
}): EmailMessage {
  return {
    to: "", // filled in by caller
    subject: "Your IFFE Bbenhe account is ready",
    text: [
      `Hello ${params.name},`,
      "",
      "An account has been created for you at IFFE Bbenhe. Sign in with these",
      "one-time details — you'll be asked to set your own password right away:",
      "",
      `  Login email: ${params.loginEmail}`,
      `  Temporary password: ${params.tempPassword}`,
      "",
      `Sign in: ${params.loginUrl}`,
      "",
      "For your security, please change this temporary password as soon as you sign in.",
      "",
      "— IFFE Bbenhe Team",
    ].join("\n"),
    html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Your IFFE Bbenhe account is ready</h2>
        <p>Hello ${escapeHtml(params.name)},</p>
        <p>An account has been created for you. Sign in with these one-time details — you'll be asked to set your own password right away:</p>
        <table style="border-collapse:collapse; margin:16px 0;">
          <tr><td style="padding:4px 16px 4px 0; color:#666;">Login email</td><td style="font-family:monospace;">${escapeHtml(params.loginEmail)}</td></tr>
          <tr><td style="padding:4px 16px 4px 0; color:#666;">Temporary password</td><td style="font-family:monospace; letter-spacing:1px;">${escapeHtml(params.tempPassword)}</td></tr>
        </table>
        <p>
          <a href="${params.loginUrl}" style="display:inline-block; padding:12px 20px; background:#006622; color:#fff; border-radius:6px; text-decoration:none;">
            Sign in
          </a>
        </p>
        <p style="color:#666; font-size:14px;">For your security, please change this temporary password as soon as you sign in.</p>
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
