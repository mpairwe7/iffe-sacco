import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../config/db";
import { hashPassword, comparePassword } from "../utils/password";
import { signSessionToken } from "../utils/jwt";
import { getSessionExpiryDate } from "../utils/session";
import { env } from "../config/env";
import { HTTPException } from "hono/http-exception";
import type {
  LoginInput,
  PasswordResetRequestResponse,
  RegisterInput,
  UpdateProfileInput,
  User,
} from "@iffe/shared";

function toUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  avatar: string | null;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
}): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role as User["role"],
    avatar: user.avatar,
    isActive: user.isActive,
    lastLogin: user.lastLogin?.toISOString() || null,
    createdAt: user.createdAt.toISOString(),
  };
}

function buildPasswordResetLink(token: string) {
  return `${env.APP_BASE_URL.replace(/\/$/, "")}/password/reset?token=${encodeURIComponent(token)}`;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createOpaqueToken() {
  return randomBytes(32).toString("base64url");
}

export class AuthService {
  private async createSession(user: { id: string; role: string }, remember = false) {
    const expiresAt = getSessionExpiryDate(remember);
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        expiresAt,
        lastUsedAt: new Date(),
      },
    });

    const sessionToken = await signSessionToken(
      { sub: user.id, role: user.role, sid: session.id },
      expiresAt,
    );

    return { sessionToken, expiresAt, sessionId: session.id };
  }

  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new HTTPException(409, { message: "Email already registered" });

    const password = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        password,
        role: input.role || "member",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    const session = await this.createSession(user);

    return {
      user: toUser(user),
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
      sessionId: session.sessionId,
    };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        password: true,
      },
    });

    if (!user) throw new HTTPException(401, { message: "Invalid email or password" });
    if (!user.isActive) throw new HTTPException(403, { message: "Account is deactivated" });

    const valid = await comparePassword(input.password, user.password);
    if (!valid) throw new HTTPException(401, { message: "Invalid email or password" });

    const lastLogin = new Date();
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    const session = await this.createSession(updatedUser, input.remember);

    return {
      user: toUser(updatedUser),
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
      sessionId: session.sessionId,
    };
  }

  async logout(sessionId: string) {
    await prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        avatar: true,
      },
    });
    if (!user) throw new HTTPException(404, { message: "User not found" });
    return toUser(user);
  }

  async changePassword(
    userId: string,
    input: { currentPassword: string; newPassword: string },
    sessionId?: string,
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HTTPException(404, { message: "User not found" });

    const valid = await comparePassword(input.currentPassword, user.password);
    if (!valid) throw new HTTPException(401, { message: "Current password is incorrect" });

    const password = await hashPassword(input.newPassword);
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { password } }),
      prisma.session.updateMany({
        where: {
          userId,
          revokedAt: null,
          ...(sessionId ? { NOT: { id: sessionId } } : {}),
        },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const existing = await prisma.user.findFirst({ where: { email: input.email, NOT: { id: userId } } });
    if (existing) throw new HTTPException(409, { message: "Email already in use by another account" });

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: input.name, email: input.email, phone: input.phone },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, lastLogin: true, createdAt: true, avatar: true },
    });
    return toUser(user);
  }

  async issuePasswordResetTokenForUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new HTTPException(404, { message: "User not found" });
    }

    const token = createOpaqueToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TTL_MINUTES * 60 * 1000);

    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: { userId, usedAt: null },
      }),
      prisma.passwordResetToken.create({
        data: {
          userId,
          tokenHash,
          expiresAt,
        },
      }),
    ]);

    const resetUrl = buildPasswordResetLink(token);
    console.info(`[PASSWORD_RESET] ${user.email}: ${resetUrl}`);
    return { resetUrl, expiresAt };
  }

  async requestPasswordReset(email: string): Promise<PasswordResetRequestResponse> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return {};
    }

    const { resetUrl } = await this.issuePasswordResetTokenForUser(user.id);
    return env.NODE_ENV === "production" ? {} : { debugResetUrl: resetUrl };
  }

  async confirmPasswordReset(token: string, newPassword: string) {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
      throw new HTTPException(400, { message: "Reset link is invalid or has expired" });
    }

    const password = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
          NOT: { id: resetToken.id },
        },
      }),
      prisma.session.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { userId: resetToken.userId };
  }
}
