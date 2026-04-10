import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  changePasswordSchema,
  confirmPasswordResetSchema,
  loginSchema,
  registerSchema,
  requestPasswordResetSchema,
  updateProfileSchema,
} from "@iffe/shared";
import { AuthService } from "../services/auth.service";
import { authMiddleware, type AuthEnv } from "../middleware/auth";
import { authRateLimit } from "../middleware/rate-limit";
import { accountLockoutGuard } from "../middleware/account-lockout";
import { clearSessionCookie, getSessionCookie, setSessionCookie } from "../utils/session";
import { verifySessionToken } from "../utils/jwt";
import { writeAuditLog } from "../utils/audit";
import { prisma } from "../config/db";

const auth = new Hono<AuthEnv>();
const service = new AuthService();

// Mark login/register as CSRF-exempt: there's no session cookie yet to
// compare against. Brute-force protection is handled by the rate limiter
// and per-account lockout below.
auth.use("/login", async (c, next) => { c.set("csrf:skip", true); await next(); });
auth.use("/register", async (c, next) => { c.set("csrf:skip", true); await next(); });
auth.use("/reset-password", async (c, next) => { c.set("csrf:skip", true); await next(); });
auth.use("/reset-password/confirm", async (c, next) => { c.set("csrf:skip", true); await next(); });
auth.use("/logout", async (c, next) => { c.set("csrf:skip", true); await next(); });

auth.use("/login", authRateLimit("auth:login"));
auth.use("/login", accountLockoutGuard);
auth.use("/register", authRateLimit("auth:register"));
auth.use("/reset-password", authRateLimit("auth:reset-request"));
auth.use("/reset-password/confirm", authRateLimit("auth:reset-confirm"));

auth.post("/register", zValidator("json", registerSchema), async (c) => {
  const data = c.req.valid("json");
  const result = await service.register(data);
  setSessionCookie(c, result.sessionToken, result.expiresAt);
  await writeAuditLog(c, {
    userId: result.user.id,
    action: "register",
    entity: "user",
    entityId: result.user.id,
    details: { role: result.user.role },
  });
  return c.json({ success: true, data: { user: result.user } }, 201);
});

auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const data = c.req.valid("json");
  const result = await service.login(data);
  setSessionCookie(c, result.sessionToken, result.expiresAt);
  await writeAuditLog(c, {
    userId: result.user.id,
    action: "login",
    entity: "session",
    entityId: result.sessionId,
    details: { remember: Boolean(data.remember) },
  });
  return c.json({ success: true, data: { user: result.user } });
});

// Logout is deliberately permissive: we must ALWAYS clear the cookie so a
// user with a partially-broken session can still sign out. If we have a
// verifiable JWT we also revoke the DB session and write an audit log,
// but none of that is required for the cookie sweep to succeed.
auth.post("/logout", async (c) => {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : getSessionCookie(c);

  let userId: string | undefined;
  let sessionId: string | undefined;

  if (token) {
    try {
      const payload = await verifySessionToken(token);
      userId = payload.sub;
      sessionId = payload.sid;
    } catch {
      // Invalid / expired token — still proceed to cookie sweep below.
    }
  }

  if (sessionId) {
    try {
      await service.logout(sessionId);
    } catch {
      // Non-fatal — we still want to clear the cookie.
    }
  } else if (userId) {
    // JWT decoded but no session id — revoke any live sessions for the
    // user as a safety net, so a stale cookie cannot resurrect them.
    try {
      await prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // non-fatal
    }
  }

  clearSessionCookie(c);

  if (userId) {
    try {
      await writeAuditLog(c, {
        userId,
        action: "logout",
        entity: "session",
        entityId: sessionId,
      });
    } catch {
      // non-fatal
    }
  }

  return c.json({ success: true, message: "Logged out successfully" });
});

auth.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  const profile = await service.me(user.id);
  return c.json({ success: true, data: profile });
});

auth.patch("/change-password", authMiddleware, zValidator("json", changePasswordSchema), async (c) => {
  const data = c.req.valid("json");
  const user = c.get("user");
  await service.changePassword(user.id, data, user.sessionId);
  await writeAuditLog(c, {
    action: "change_password",
    entity: "user",
    entityId: user.id,
  });
  return c.json({ success: true, message: "Password changed successfully" });
});

auth.put("/profile", authMiddleware, zValidator("json", updateProfileSchema), async (c) => {
  const data = c.req.valid("json");
  const user = c.get("user");
  const profile = await service.updateProfile(user.id, data);
  await writeAuditLog(c, {
    action: "update_profile",
    entity: "user",
    entityId: user.id,
    details: { email: profile.email, phone: profile.phone },
  });
  return c.json({ success: true, data: profile });
});

auth.post("/reset-password", zValidator("json", requestPasswordResetSchema), async (c) => {
  const { email } = c.req.valid("json");
  const result = await service.requestPasswordReset(email);
  return c.json({
    success: true,
    message: "If an account with that email exists, a reset link has been sent",
    data: result,
  });
});

auth.post("/reset-password/confirm", zValidator("json", confirmPasswordResetSchema), async (c) => {
  const data = c.req.valid("json");
  const result = await service.confirmPasswordReset(data.token, data.newPassword);
  clearSessionCookie(c);
  await writeAuditLog(c, {
    userId: result.userId,
    action: "password_reset",
    entity: "user",
    entityId: result.userId,
  });
  return c.json({ success: true, message: "Password reset successfully" });
});

export { auth as authRoutes };
