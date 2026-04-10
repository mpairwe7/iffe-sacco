"use client";

import { useQuery } from "@tanstack/react-query";
import { accountsApi, type AccountQueryParams } from "@/lib/api/accounts";

export function useAccounts(params?: AccountQueryParams) {
  return useQuery({
    queryKey: ["accounts", params],
    queryFn: () => accountsApi.getAccounts(params),
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: ["accounts", id],
    queryFn: () => accountsApi.getAccount(id),
    enabled: !!id,
  });
}

export function useAccountStats() {
  return useQuery({
    queryKey: ["accounts", "stats"],
    queryFn: accountsApi.getAccountStats,
  });
}
