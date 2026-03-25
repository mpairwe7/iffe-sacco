import { prisma } from "../config/db";
import type { PaginationInput } from "@iffe/shared";

export class AccountRepository {
  async findAll(params: PaginationInput & { type?: string; status?: string; memberId?: string }) {
    const { page = 1, limit = 20, search, sortBy = "createdAt", sortOrder = "desc", type, status, memberId } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (memberId) where.memberId = memberId;
    if (search) {
      where.OR = [
        { accountNo: { contains: search, mode: "insensitive" } },
        { member: { firstName: { contains: search, mode: "insensitive" } } },
        { member: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.account.findMany({
        where, skip, take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { member: true },
      }),
      prisma.account.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    return prisma.account.findUnique({
      where: { id },
      include: {
        member: true,
        transactions: { take: 10, orderBy: { createdAt: "desc" } },
      },
    });
  }

  async create(data: { memberId: string; type: string; interestRate?: number }) {
    const prefix = data.type === "current" ? "CUR" : data.type === "fixed_deposit" ? "FIX" : "SAV";

    // Retry loop for unique account number generation
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const count = await prisma.account.count();
        const accountNo = `${prefix}-${String(count + 1 + attempt).padStart(4, "0")}`;

        return await prisma.account.create({
          data: {
            accountNo,
            memberId: data.memberId,
            type: data.type,
            interestRate: data.interestRate || 12,
            status: "active",
          },
        });
      } catch (err: any) {
        if (err.code === "P2002" && attempt < 4) continue; // Unique constraint violation, retry
        throw err;
      }
    }
    throw new Error("Failed to generate unique account number");
  }

  async updateStatus(id: string, status: string) {
    return prisma.account.update({ where: { id }, data: { status } });
  }

  async getStats() {
    const [total, active, dormant, totalBalance] = await Promise.all([
      prisma.account.count(),
      prisma.account.count({ where: { status: "active" } }),
      prisma.account.count({ where: { status: "dormant" } }),
      prisma.account.aggregate({ where: { status: "active" }, _sum: { balance: true } }),
    ]);
    return { total, active, dormant, totalBalance: totalBalance._sum.balance || 0 };
  }
}
