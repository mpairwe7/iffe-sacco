import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { updateUserSchema, paginationSchema } from "@iffe/shared";
import { prisma } from "../config/db";
import { authMiddleware, requireRole } from "../middleware/auth";
import { HTTPException } from "hono/http-exception";

const users = new Hono();

users.use("*", authMiddleware);
users.use("*", requireRole("admin"));

users.get("/", zValidator("query", paginationSchema), async (c) => {
  const { page = 1, limit = 20, search, sortBy = "createdAt", sortOrder = "desc" } = c.req.valid("query");
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where, skip, take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, lastLogin: true, createdAt: true, avatar: true },
    }),
    prisma.user.count({ where }),
  ]);

  return c.json({ success: true, data: { data, total, page, limit, totalPages: Math.ceil(total / limit) } });
});

users.get("/:id", async (c) => {
  const user = await prisma.user.findUnique({
    where: { id: c.req.param("id") },
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, lastLogin: true, createdAt: true, avatar: true },
  });
  if (!user) throw new HTTPException(404, { message: "User not found" });
  return c.json({ success: true, data: user });
});

users.put("/:id", zValidator("json", updateUserSchema), async (c) => {
  const data = c.req.valid("json");
  const user = await prisma.user.update({
    where: { id: c.req.param("id") },
    data,
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, lastLogin: true, createdAt: true, avatar: true },
  });
  return c.json({ success: true, data: user });
});

users.patch("/:id/deactivate", async (c) => {
  const user = await prisma.user.update({
    where: { id: c.req.param("id") },
    data: { isActive: false },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  return c.json({ success: true, data: user });
});

users.patch("/:id/activate", async (c) => {
  const user = await prisma.user.update({
    where: { id: c.req.param("id") },
    data: { isActive: true },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  return c.json({ success: true, data: user });
});

export { users as userRoutes };
