import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { verifySessionToken } from "../utils/jwt";
import { prisma } from "../config/db";
import { getSessionCookie } from "../utils/session";

export type AuthUser = {
  id: string;
  role: string;
  memberId: string | null;
  sessionId: string;
  mustChangePassword: boolean;
};

// While an account is flagged mustChangePassword (issued a temporary password),
// every authenticated request is blocked EXCEPT the few endpoints the member
// needs to escape the state: read their profile, set a new password, log out.
const PASSWORD_CHANGE_ALLOWED_SUFFIXES = ["/auth/me", "/auth/logout", "/auth/set-initial-password"];
export type AuthEnv = { Variables: { user: AuthUser } };

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : getSessionCookie(c);

  if (!token) {
    throw new HTTPException(401, { message: "Missing or invalid authorization token" });
  }

  try {
    const payload = await verifySessionToken(token);

    const session = await prisma.session.findFirst({
      where: {
        id: payload.sid,
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        lastUsedAt: true,
        user: {
          select: {
            id: true,
            role: true,
            isActive: true,
            mustChangePassword: true,
            member: { select: { id: true } },
          },
        },
      },
    });

    const dbUser = session?.user;
    if (!session || !dbUser || !dbUser.isActive) {
      throw new HTTPException(401, { message: "Account is deactivated or not found" });
    }

    if (!session.lastUsedAt || Date.now() - session.lastUsedAt.getTime() > 15 * 60 * 1000) {
      void prisma.session
        .update({
          where: { id: session.id },
          data: { lastUsedAt: new Date() },
        })
        .catch(() => undefined);
    }

    c.set("user", {
      id: dbUser.id,
      role: dbUser.role,
      memberId: dbUser.member?.id || null,
      sessionId: session.id,
      mustChangePassword: dbUser.mustChangePassword,
    });

    if (dbUser.mustChangePassword) {
      const path = c.req.path;
      const allowed = PASSWORD_CHANGE_ALLOWED_SUFFIXES.some((suffix) => path.endsWith(suffix));
      if (!allowed) {
        throw new HTTPException(403, { message: "PASSWORD_CHANGE_REQUIRED" });
      }
    }

    await next();
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    throw new HTTPException(401, { message: "Token expired or invalid" });
  }
});

export const requireRole = (...roles: string[]) =>
  createMiddleware<AuthEnv>(async (c, next) => {
    const user = c.get("user");
    if (!user || !roles.includes(user.role)) {
      throw new HTTPException(403, { message: "Insufficient permissions" });
    }
    await next();
  });
