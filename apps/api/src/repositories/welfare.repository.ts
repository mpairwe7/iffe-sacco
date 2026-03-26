import { prisma } from "../config/db";
import type { PaginationInput } from "@iffe/shared";

export class WelfareRepository {
  async findAll(params: PaginationInput & { status?: string }) {
    const { page = 1, limit = 20, search, sortBy = "createdAt", sortOrder = "desc", status } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.welfareProgram.findMany({
        where, skip, take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { _count: { select: { pledges: true } } },
      }),
      prisma.welfareProgram.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    return prisma.welfareProgram.findUnique({
      where: { id },
      include: { pledges: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
  }

  async create(data: { name: string; description: string; targetAmount: number }) {
    return prisma.welfareProgram.create({ data: { ...data, status: "active" } });
  }

  async update(id: string, data: Record<string, unknown>) {
    return prisma.welfareProgram.update({ where: { id }, data });
  }

  async updateStatus(id: string, status: string) {
    return prisma.welfareProgram.update({ where: { id }, data: { status } });
  }

  async getStats() {
    const [totalPrograms, activePrograms, totalRaised] = await Promise.all([
      prisma.welfareProgram.count(),
      prisma.welfareProgram.count({ where: { status: "active" } }),
      prisma.welfareProgram.aggregate({ _sum: { raisedAmount: true } }),
    ]);
    return {
      totalPrograms,
      activePrograms,
      totalRaised: totalRaised._sum.raisedAmount || 0,
    };
  }
}
