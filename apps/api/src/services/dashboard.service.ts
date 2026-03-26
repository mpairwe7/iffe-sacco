import { prisma } from "../config/db";
import type { DashboardStats } from "@iffe/shared";

export class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const [
      totalMembers,
      deposits,
      withdrawals,
      activeLoans,
      activeLoanAmount,
      expenses,
      savings,
      pending,
    ] = await Promise.all([
      prisma.member.count(),
      prisma.transaction.aggregate({ where: { type: "deposit", status: "completed" }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { type: "withdrawal", status: "completed" }, _sum: { amount: true } }),
      prisma.loan.count({ where: { status: "active" } }),
      prisma.loan.aggregate({ where: { status: "active" }, _sum: { balance: true } }),
      prisma.expense.aggregate({ where: { status: "approved" }, _sum: { amount: true } }),
      prisma.account.aggregate({ where: { status: "active" }, _sum: { balance: true } }),
      prisma.transaction.count({ where: { status: "pending" } }),
    ]);

    return {
      totalMembers,
      totalDeposits: deposits._sum.amount?.toNumber() || 0,
      totalWithdrawals: withdrawals._sum.amount?.toNumber() || 0,
      activeLoans,
      activeLoanAmount: activeLoanAmount._sum.balance?.toNumber() || 0,
      totalExpenses: expenses._sum.amount?.toNumber() || 0,
      totalSavings: savings._sum.balance?.toNumber() || 0,
      pendingRequests: pending,
    };
  }

  async getRecentTransactions(limit = 10) {
    return prisma.transaction.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { account: { include: { member: true } } },
    });
  }

  async getUpcomingLoanPayments(days = 7) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);

    return prisma.loan.findMany({
      where: {
        status: "active",
        nextPaymentDate: { lte: deadline },
      },
      orderBy: { nextPaymentDate: "asc" },
      include: { member: true },
      take: 10,
    });
  }
}
