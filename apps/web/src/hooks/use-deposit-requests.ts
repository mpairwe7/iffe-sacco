"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { depositRequestsApi } from "@/lib/api/deposit-requests";
import type { PaginationParams } from "@iffe/shared";

export function useDepositRequests(params?: PaginationParams) {
  return useQuery({
    queryKey: ["deposit-requests", params],
    queryFn: () => depositRequestsApi.getAll(params),
  });
}

export function useCreateDepositRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { accountId: string; amount: number; method?: string; description?: string }) =>
      depositRequestsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deposit-requests"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useApproveDepositRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => depositRequestsApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deposit-requests"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useRejectDepositRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => depositRequestsApi.reject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deposit-requests"] }),
  });
}
