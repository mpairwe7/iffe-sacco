import { prisma } from "../config/db";
import type { PaginationInput } from "@iffe/shared";

export class ExpenseRepository {
  async findAll(params: PaginationInput & { category?: string; status?: string }) {
    const { page = 1, limit = 20, search, sortBy = "createdAt", sortOrder = "desc", category, status } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.expense.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder } }),
      prisma.expense.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    return prisma.expense.findUnique({ where: { id } });
  }

  async create(data: { description: string; category: string; amount: number; date: string; status?: string }) {
    return prisma.expense.create({ data: { ...data, date: new Date(data.date), status: data.status || "pending" } });
  }

  async update(id: string, data: Record<string, unknown>) {
    if (data.date && typeof data.date === "string") {
      data.date = new Date(data.date);
    }
    return prisma.expense.update({ where: { id }, data });
  }

  async updateStatus(id: string, status: string, approvedBy?: string) {
    return prisma.expense.update({ where: { id }, data: { status, approvedBy } });
  }

  async delete(id: string) {
    return prisma.expense.delete({ where: { id } });
  }

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [totalApproved, totalPending, totalThisMonth] = await Promise.all([
      prisma.expense.aggregate({ where: { status: "approved" }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { status: "pending" }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { status: "approved", date: { gte: startOfMonth } }, _sum: { amount: true } }),
    ]);
    return {
      totalThisMonth: totalThisMonth._sum.amount || 0,
      approved: totalApproved._sum.amount || 0,
      pending: totalPending._sum.amount || 0,
    };
  }
}
