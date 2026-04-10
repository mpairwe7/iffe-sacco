import { prisma, withTx } from "../config/db";
import type { PaginationInput } from "@iffe/shared";

export class TransactionRepository {
  async findAll(params: PaginationInput & { type?: string; status?: string; accountId?: string }) {
    const { page = 1, limit = 20, search, sortBy = "createdAt", sortOrder = "desc", type, status, accountId } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (accountId) where.accountId = accountId;
    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
        { account: { member: { firstName: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { account: { include: { member: true } } },
      }),
      prisma.transaction.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    return prisma.transaction.findUnique({ where: { id }, include: { account: { include: { member: true } } } });
  }

  async create(data: {
    accountId: string;
    type: string;
    amount: number;
    method: string;
    description?: string;
    reference?: string;
    status?: string;
    processedBy?: string;
  }) {
    return withTx(async (tx) => {
      const txn = await tx.transaction.create({ data: { ...data, status: data.status || "pending" } });

      // Auto-update account balance for completed transactions
      if (data.status === "completed") {
        const delta = ["deposit", "loan_disbursement", "interest_credit"].includes(data.type)
          ? data.amount
          : -data.amount;

        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: { increment: delta }, lastActivity: new Date() },
        });
      }

      return txn;
    });
  }

  async updateStatus(id: string, status: string, processedBy?: string) {
    return withTx(async (tx) => {
      const txn = await tx.transaction.findUniqueOrThrow({ where: { id } });
      const updated = await tx.transaction.update({ where: { id }, data: { status, processedBy } });

      // Adjust balance when approving a pending transaction
      if (txn.status === "pending" && status === "completed") {
        const amount = Number(txn.amount);
        const delta = ["deposit", "loan_disbursement", "interest_credit"].includes(txn.type) ? amount : -amount;

        await tx.account.update({
          where: { id: txn.accountId },
          data: { balance: { increment: delta }, lastActivity: new Date() },
        });
      }

      return updated;
    });
  }

  async getStats() {
    const [totalDeposits, totalWithdrawals, pending] = await Promise.all([
      prisma.transaction.aggregate({ where: { type: "deposit", status: "completed" }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { type: "withdrawal", status: "completed" }, _sum: { amount: true } }),
      prisma.transaction.count({ where: { status: "pending" } }),
    ]);
    return {
      totalDeposits: totalDeposits._sum.amount || 0,
      totalWithdrawals: totalWithdrawals._sum.amount || 0,
      pending,
    };
  }
}
