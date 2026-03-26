import { prisma } from "../config/db";
import { hashPassword, comparePassword } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { HTTPException } from "hono/http-exception";
import type { LoginInput, RegisterInput, UpdateProfileInput } from "@iffe/shared";

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new HTTPException(409, { message: "Email already registered" });

    const password = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, phone: input.phone, password, role: input.role || "member" },
    });

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ sub: user.id, role: user.role }),
      signRefreshToken({ sub: user.id }),
    ]);

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt.toISOString() },
      tokens: { accessToken, refreshToken },
    };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new HTTPException(401, { message: "Invalid email or password" });
    if (!user.isActive) throw new HTTPException(403, { message: "Account is deactivated" });

    const valid = await comparePassword(input.password, user.password);
    if (!valid) throw new HTTPException(401, { message: "Invalid email or password" });

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ sub: user.id, role: user.role }),
      signRefreshToken({ sub: user.id }),
    ]);

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, lastLogin: new Date().toISOString(), createdAt: user.createdAt.toISOString() },
      tokens: { accessToken, refreshToken },
    };
  }

  async refresh(refreshToken: string) {
    const payload = await verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new HTTPException(401, { message: "Invalid refresh token" });

    const [newAccess, newRefresh] = await Promise.all([
      signAccessToken({ sub: user.id, role: user.role }),
      signRefreshToken({ sub: user.id }),
    ]);

    return { accessToken: newAccess, refreshToken: newRefresh };
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, lastLogin: true, createdAt: true, avatar: true } });
    if (!user) throw new HTTPException(404, { message: "User not found" });
    return user;
  }

  async changePassword(userId: string, input: { currentPassword: string; newPassword: string }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HTTPException(404, { message: "User not found" });

    const valid = await comparePassword(input.currentPassword, user.password);
    if (!valid) throw new HTTPException(401, { message: "Current password is incorrect" });

    const password = await hashPassword(input.newPassword);
    await prisma.user.update({ where: { id: userId }, data: { password } });
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const existing = await prisma.user.findFirst({ where: { email: input.email, NOT: { id: userId } } });
    if (existing) throw new HTTPException(409, { message: "Email already in use by another account" });

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: input.name, email: input.email, phone: input.phone },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, lastLogin: true, createdAt: true, avatar: true },
    });
    return user;
  }
}
