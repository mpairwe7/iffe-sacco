import { prisma } from "../config/db";
import type { PaginationInput } from "@iffe/shared";

export class BankAccountRepository {
  async findAll(params: PaginationInput) {
    const { page = 1, limit = 20, search, sortBy = "createdAt", sortOrder = "desc" } = params;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { bankName: { contains: search, mode: "insensitive" as const } },
            { accountName: { contains: search, mode: "insensitive" as const } },
            { accountNo: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.bankAccount.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder } }),
      prisma.bankAccount.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    return prisma.bankAccount.findUnique({ where: { id } });
  }

  async create(data: { bankName: string; accountName: string; accountNo: string; branch?: string; balance?: number }) {
    return prisma.bankAccount.create({ data: { ...data, status: "active" } });
  }

  async update(id: string, data: Record<string, unknown>) {
    return prisma.bankAccount.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.bankAccount.delete({ where: { id } });
  }

  async getStats() {
    const [total, totalBalance] = await Promise.all([
      prisma.bankAccount.count(),
      prisma.bankAccount.aggregate({ _sum: { balance: true } }),
    ]);
    return { total, totalBalance: totalBalance._sum.balance || 0 };
  }
}
