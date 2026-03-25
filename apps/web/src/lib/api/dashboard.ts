import { apiClient } from "@/lib/api-client";
import type { DashboardStats, Transaction, Loan } from "@iffe/shared";

export const dashboardApi = {
  getStats: () =>
    apiClient.get<DashboardStats>("/dashboard/stats"),
  getRecentTransactions: (limit?: number) =>
    apiClient.get<Transaction[]>("/dashboard/recent-transactions", { limit }),
  getUpcomingPayments: (days?: number) =>
    apiClient.get<Loan[]>("/dashboard/upcoming-payments", { days }),
};
