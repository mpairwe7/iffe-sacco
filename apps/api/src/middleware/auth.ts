import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { verifyAccessToken } from "../utils/jwt";
import { prisma } from "../config/db";

export type AuthUser = { id: string; role: string };

export const authMiddleware = createMiddleware<{ Variables: { user: AuthUser } }>(
  async (c, next) => {
    const header = c.req.header("Authorization");
    if (!header?.startsWith("Bearer ")) {
      throw new HTTPException(401, { message: "Missing or invalid authorization token" });
    }

    try {
      const token = header.slice(7);
      const payload = await verifyAccessToken(token);

      const dbUser = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, isActive: true },
      });
      if (!dbUser || !dbUser.isActive) {
        throw new HTTPException(401, { message: "Account is deactivated or not found" });
      }

      c.set("user", { id: dbUser.id, role: dbUser.role });
      await next();
    } catch (err) {
      if (err instanceof HTTPException) throw err;
      throw new HTTPException(401, { message: "Token expired or invalid" });
    }
  }
);

export const requireRole = (...roles: string[]) =>
  createMiddleware<{ Variables: { user: AuthUser } }>(async (c, next) => {
    const user = c.get("user");
    if (!user || !roles.includes(user.role)) {
      throw new HTTPException(403, { message: "Insufficient permissions" });
    }
    await next();
  });
