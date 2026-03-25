import { prisma } from "../config/db";
import type { PaginationInput } from "@iffe/shared";

export class AuditLogRepository {
  async findAll(params: PaginationInput & { userId?: string; entity?: string; action?: string }) {
    const { page = 1, limit = 20, sortOrder = "desc", userId, entity, action } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (entity) where.entity = entity;
    if (action) where.action = action;

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: sortOrder },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(data: { userId: string; action: string; entity: string; entityId?: string; details?: unknown; ipAddress?: string }) {
    return prisma.auditLog.create({ data: data as Parameters<typeof prisma.auditLog.create>[0]["data"] });
  }
}
