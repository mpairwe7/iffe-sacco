import { prisma } from "../config/db";
import { HTTPException } from "hono/http-exception";
import type { PaginationInput } from "../../../shared/src";

export class TransactionService {
  async getAll(params: PaginationInput & { type?: string; status?: string; accountId?: string }) {
    const { page = 1, limit = 20, search, sortBy = "createdAt", sortOrder = "desc", type, status, accountId } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (accountId) where.accountId = accountId;
    if (search) where.OR = [
      { description: { contains: search, mode: "insensitive" } },
      { reference: { contains: search, mode: "insensitive" } },
    ];
    const [data, total] = await Promise.all([
      prisma.transaction.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder }, include: { account: { include: { member: true } } } }),
      prisma.transaction.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(id: string) {
    const txn = await prisma.transaction.findUnique({ where: { id }, include: { account: { include: { member: true } } } });
    if (!txn) throw new HTTPException(404, { message: "Transaction not found" });
    return txn;
  }

  async create(data: { accountId: string; type: string; amount: number; method: string; description?: string; reference?: string; processedBy?: string }) {
    // Validate account exists and is active
    const account = await prisma.account.findUnique({ where: { id: data.accountId } });
    if (!account) throw new HTTPException(404, { message: "Account not found" });
    if (account.status !== "active") throw new HTTPException(400, { message: "Account is not active" });

    // For withdrawals, check sufficient balance
    if (["withdrawal", "transfer", "fee"].includes(data.type)) {
      if (Number(account.balance) < data.amount) {
        throw new HTTPException(400, { message: "Insufficient balance" });
      }
    }

    return prisma.$transaction(async (tx) => {
      const txn = await tx.transaction.create({ data: { ...data, status: "pending" } });
      return txn;
    });
  }

  async approve(id: string, processedBy: string) {
    const txn = await this.getById(id);
    if (txn.status !== "pending") throw new HTTPException(400, { message: "Transaction is not pending" });

    return prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({ where: { id }, data: { status: "completed", processedBy } });

      // Update account balance
      const isCredit = ["deposit", "loan_disbursement", "interest_credit"].includes(txn.type);
      const delta = isCredit ? Number(txn.amount) : -Number(txn.amount);
      await tx.account.update({ where: { id: txn.accountId }, data: { balance: { increment: delta }, lastActivity: new Date() } });

      return updated;
    });
  }

  async reject(id: string, processedBy: string) {
    const txn = await this.getById(id);
    if (txn.status !== "pending") throw new HTTPException(400, { message: "Transaction is not pending" });
    return prisma.transaction.update({ where: { id }, data: { status: "rejected", processedBy } });
  }

  async reverse(id: string, processedBy: string) {
    const txn = await this.getById(id);
    if (txn.status !== "completed") throw new HTTPException(400, { message: "Only completed transactions can be reversed" });

    return prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({ where: { id }, data: { status: "reversed", processedBy } });

      // Reverse the balance change
      const isCredit = ["deposit", "loan_disbursement", "interest_credit"].includes(txn.type);
      const delta = isCredit ? -Number(txn.amount) : Number(txn.amount);
      await tx.account.update({ where: { id: txn.accountId }, data: { balance: { increment: delta }, lastActivity: new Date() } });

      return updated;
    });
  }

  async getStats() {
    const [totalDeposits, totalWithdrawals, pending] = await Promise.all([
      prisma.transaction.aggregate({ where: { type: "deposit", status: "completed" }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { type: "withdrawal", status: "completed" }, _sum: { amount: true } }),
      prisma.transaction.count({ where: { status: "pending" } }),
    ]);
    return { totalDeposits: totalDeposits._sum.amount || 0, totalWithdrawals: totalWithdrawals._sum.amount || 0, pending };
  }
}
