import { apiClient } from "@/lib/api-client";
import type { DashboardStats, Transaction, Loan } from "@iffe/shared";

interface MonthlyPoint {
  month: string;
  label: string;
  deposits: number;
  withdrawals: number;
}
interface ExpenseSlice {
  name: string;
  value: number;
}
interface LoanPoint {
  month: string;
  label: string;
  disbursed: number;
  repaid: number;
}

export const dashboardApi = {
  getStats: () => apiClient.get<DashboardStats>("/dashboard/stats"),
  getRecentTransactions: (limit?: number) => apiClient.get<Transaction[]>("/dashboard/recent-transactions", { limit }),
  getUpcomingPayments: (days?: number) => apiClient.get<Loan[]>("/dashboard/upcoming-payments", { days }),
  // Server-aggregated chart data
  getMonthlyTransactions: (months?: number) =>
    apiClient.get<MonthlyPoint[]>("/dashboard/charts/monthly-transactions", { months }),
  getExpenseBreakdown: () => apiClient.get<ExpenseSlice[]>("/dashboard/charts/expense-breakdown"),
  getLoanTrends: (months?: number) => apiClient.get<LoanPoint[]>("/dashboard/charts/loan-trends", { months }),
};
