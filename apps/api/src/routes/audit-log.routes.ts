import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { paginationSchema } from "@iffe/shared";
import { prisma } from "../config/db";
import { authMiddleware, requireRole } from "../middleware/auth";

const auditLogs = new Hono();
auditLogs.use("*", authMiddleware);
auditLogs.use("*", requireRole("admin"));

// GET / — list with pagination, filter by userId, entity, action
auditLogs.get("/", zValidator("query", paginationSchema), async (c) => {
  const { page = 1, limit = 20, search, sortOrder = "desc" } = c.req.valid("query");
  const userId = c.req.query("userId");
  const entity = c.req.query("entity");
  const action = c.req.query("action");

  const where: any = {};
  if (userId) where.userId = userId;
  if (entity) where.entity = entity;
  if (action) where.action = action;
  if (search)
    where.OR = [
      { action: { contains: search, mode: "insensitive" } },
      { entity: { contains: search, mode: "insensitive" } },
    ];

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: sortOrder },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return c.json({ success: true, data: { data, total, page, limit, totalPages: Math.ceil(total / limit) } });
});

// GET /:id — get single
auditLogs.get("/:id", async (c) => {
  const id = c.req.param("id");
  const log = await prisma.auditLog.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!log) return c.json({ success: false, message: "Audit log not found" }, 404);
  return c.json({ success: true, data: log });
});

export { auditLogs as auditLogRoutes };
