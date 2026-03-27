"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api/dashboard";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: dashboardApi.getStats,
  });
}

export function useRecentTransactions(limit?: number) {
  return useQuery({
    queryKey: ["dashboard", "recent-transactions", limit],
    queryFn: () => dashboardApi.getRecentTransactions(limit),
  });
}

export function useUpcomingPayments(days?: number) {
  return useQuery({
    queryKey: ["dashboard", "upcoming-payments", days],
    queryFn: () => dashboardApi.getUpcomingPayments(days),
  });
}

// Server-aggregated chart data — no raw records
export function useMonthlyTransactions(months = 12) {
  return useQuery({
    queryKey: ["dashboard", "charts", "monthly-transactions", months],
    queryFn: () => dashboardApi.getMonthlyTransactions(months),
  });
}

export function useExpenseBreakdown() {
  return useQuery({
    queryKey: ["dashboard", "charts", "expense-breakdown"],
    queryFn: dashboardApi.getExpenseBreakdown,
  });
}

export function useLoanTrends(months = 12) {
  return useQuery({
    queryKey: ["dashboard", "charts", "loan-trends", months],
    queryFn: () => dashboardApi.getLoanTrends(months),
  });
}
