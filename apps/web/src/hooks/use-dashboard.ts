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
