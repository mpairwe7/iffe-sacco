import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { loginSchema, registerSchema, refreshTokenSchema, changePasswordSchema, updateProfileSchema } from "../../../shared/src";
import { AuthService } from "../services/auth.service";
import { prisma } from "../config/db";
import { authMiddleware } from "../middleware/auth";
import { z } from "zod/v4";

const auth = new Hono();
const service = new AuthService();

auth.post("/register", zValidator("json", registerSchema), async (c) => {
  const data = c.req.valid("json");
  const result = await service.register(data);
  return c.json({ success: true, data: result }, 201);
});

auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const data = c.req.valid("json");
  const result = await service.login(data);
  return c.json({ success: true, data: result });
});

auth.post("/refresh", zValidator("json", refreshTokenSchema), async (c) => {
  const { refreshToken } = c.req.valid("json");
  const tokens = await service.refresh(refreshToken);
  return c.json({ success: true, data: tokens });
});

auth.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");
  const profile = await service.me(user.id);
  return c.json({ success: true, data: profile });
});

auth.patch("/change-password", authMiddleware, zValidator("json", changePasswordSchema), async (c) => {
  const data = c.req.valid("json");
  const user = c.get("user");
  await service.changePassword(user.id, data);
  return c.json({ success: true, message: "Password changed successfully" });
});

auth.put("/profile", authMiddleware, zValidator("json", updateProfileSchema), async (c) => {
  const data = c.req.valid("json");
  const user = c.get("user");
  const profile = await service.updateProfile(user.id, data);
  return c.json({ success: true, data: profile });
});

const resetPasswordSchema = z.object({
  email: z.email("Valid email required"),
});

auth.post("/reset-password", zValidator("json", resetPasswordSchema), async (c) => {
  const { email } = c.req.valid("json");
  // Mock: In production, generate a token and send an email
  // For now just verify the user exists and return success
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Return success even if user doesn't exist (prevent email enumeration)
    return c.json({ success: true, message: "If an account with that email exists, a reset link has been sent" });
  }
  return c.json({ success: true, message: "If an account with that email exists, a reset link has been sent" });
});

export { auth as authRoutes };
