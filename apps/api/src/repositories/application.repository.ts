// @ts-nocheck
import { prisma } from "../config/db";
import type { PaginationInput } from "@iffe/shared";

export class ApplicationRepository {
  async findAll(params: PaginationInput & { status?: string }) {
    const { page = 1, limit = 20, search, sortBy = "createdAt", sortOrder = "desc", status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search, mode: "insensitive" as const } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.application.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder } }),
      prisma.application.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    return prisma.application.findUnique({ where: { id } });
  }

  async findByUserId(userId: string) {
    return prisma.application.findUnique({ where: { userId } });
  }

  async create(data: Record<string, unknown>) {
    return prisma.application.create({ data });
  }

  async update(id: string, data: Record<string, unknown>) {
    return prisma.application.update({ where: { id }, data });
  }

  async countByStatus() {
    const [pending, approved, rejected, total] = await Promise.all([
      prisma.application.count({ where: { status: "pending" } }),
      prisma.application.count({ where: { status: "approved" } }),
      prisma.application.count({ where: { status: "rejected" } }),
      prisma.application.count(),
    ]);
    return { pending, approved, rejected, total };
  }
}
