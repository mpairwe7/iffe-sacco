/**
 * Passkey endpoints — WebAuthn registration + login.
 *
 * Registration requires an authenticated session. Authentication is
 * public but opts out of CSRF the same way /login does (no session
 * cookie exists yet at auth time).
 */
// @ts-nocheck
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod/v4";
import { authMiddleware, type AuthEnv } from "../middleware/auth";
import { authRateLimit } from "../middleware/rate-limit";
import { setSessionCookie } from "../utils/session";
import { writeAuditLog } from "../utils/audit";
import { passkeyService } from "../services/passkey.service";

const passkeys = new Hono<AuthEnv>();

// ===== Authenticated: enrolment =====
passkeys.post("/register/options", authMiddleware, async (c) => {
  const user = c.get("user");
  const options = await passkeyService.generateRegistrationOptions(user.id);
  return c.json({ success: true, data: options });
});

const verifyRegSchema = z.object({
  response: z.any(),
  nickname: z.string().trim().max(80).optional(),
});

passkeys.post("/register/verify", authMiddleware, zValidator("json", verifyRegSchema), async (c) => {
  const user = c.get("user");
  const { response, nickname } = c.req.valid("json");
  const result = await passkeyService.verifyRegistration(user.id, response, nickname);
  await writeAuditLog(c, {
    action: "passkey_registered",
    entity: "user",
    entityId: user.id,
    details: { nickname: nickname ?? null },
  });
  return c.json({ success: true, data: result }, 201);
});

passkeys.get("/", authMiddleware, async (c) => {
  const user = c.get("user");
  const list = await passkeyService.list(user.id);
  return c.json({ success: true, data: list });
});

passkeys.delete("/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  await passkeyService.remove(user.id, id);
  await writeAuditLog(c, {
    action: "passkey_removed",
    entity: "user",
    entityId: user.id,
    details: { passkeyId: id },
  });
  return c.json({ success: true });
});

// ===== Public: authentication =====
// CSRF exemption for /passkeys/login/* lives in middleware/csrf.ts's
// CSRF_EXEMPT_PREFIXES — there's no session cookie at auth time, so
// rate limiting is the relevant brute-force guard.
passkeys.use("/login/options", authRateLimit("auth:passkey-options"));
passkeys.use("/login/verify", authRateLimit("auth:passkey-verify"));

const loginOptionsSchema = z.object({
  email: z.email().optional(),
});

passkeys.post("/login/options", zValidator("json", loginOptionsSchema), async (c) => {
  const { email } = c.req.valid("json");
  const options = await passkeyService.generateAuthenticationOptions(email);
  return c.json({ success: true, data: options });
});

const verifyAuthSchema = z.object({
  response: z.any(),
});

passkeys.post("/login/verify", zValidator("json", verifyAuthSchema), async (c) => {
  const { response } = c.req.valid("json");
  const result = await passkeyService.verifyAuthentication(response);
  setSessionCookie(c, result.sessionToken, result.expiresAt);
  await writeAuditLog(c, {
    userId: result.userId,
    action: "passkey_login",
    entity: "session",
    entityId: result.sessionId,
  });
  return c.json({ success: true, data: { userId: result.userId } });
});

export { passkeys as passkeyRoutes };
