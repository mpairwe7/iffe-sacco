import { prisma } from "../config/db";
import type { DashboardStats } from "@iffe/shared";

export class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const [totalMembers, deposits, withdrawals, activeLoans, activeLoanAmount, expenses, savings, pending] =
      await Promise.all([
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

  /**
   * Monthly deposits vs withdrawals for the last 12 months.
   * Returns server-aggregated data — no raw record transfer.
   */
  async getMonthlyTransactions(months = 12) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const transactions = await prisma.transaction.findMany({
      where: { status: "completed", createdAt: { gte: since } },
      select: { type: true, amount: true, createdAt: true },
    });

    const map: Record<string, { deposits: number; withdrawals: number }> = {};

    // Initialize all months
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = { deposits: 0, withdrawals: 0 };
    }

    for (const tx of transactions) {
      const d = new Date(tx.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) continue;
      const amt = Number(tx.amount) || 0;
      if (tx.type === "deposit" || tx.type === "loan_disbursement" || tx.type === "interest_credit") {
        map[key].deposits += amt;
      } else if (tx.type === "withdrawal" || tx.type === "loan_repayment" || tx.type === "fee") {
        map[key].withdrawals += amt;
      }
    }

    return Object.entries(map).map(([month, data]) => ({
      month,
      label: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      ...data,
    }));
  }

  /**
   * Expense breakdown by category for the current year.
   */
  async getExpenseBreakdown() {
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const expenses = await prisma.expense.findMany({
      where: { status: "approved", date: { gte: yearStart } },
      select: { category: true, amount: true },
    });

    const map: Record<string, number> = {};
    for (const e of expenses) {
      map[e.category] = (map[e.category] || 0) + (Number(e.amount) || 0);
    }

    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round((value / (total || 1)) * 100) }))
      .sort((a, b) => b.value - a.value);
  }

  /**
   * Loan portfolio by month (disbursed vs repaid) for the last 12 months.
   */
  async getLoanTrends(months = 12) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const loans = await prisma.loan.findMany({
      where: { createdAt: { gte: since } },
      select: { amount: true, balance: true, status: true, disbursedAt: true, createdAt: true },
    });

    const map: Record<string, { disbursed: number; repaid: number }> = {};
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = { disbursed: 0, repaid: 0 };
    }

    for (const loan of loans) {
      const d = new Date(loan.disbursedAt || loan.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) continue;
      const amt = Number(loan.amount) || 0;
      const bal = Number(loan.balance) || 0;
      if (["active", "paid", "overdue"].includes(loan.status)) {
        map[key].disbursed += amt;
        map[key].repaid += amt - bal;
      }
    }

    return Object.entries(map).map(([month, data]) => ({
      month,
      label: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      ...data,
    }));
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
