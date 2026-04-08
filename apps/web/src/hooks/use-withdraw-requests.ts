"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { withdrawRequestsApi } from "@/lib/api/withdraw-requests";
import type { PaginationParams } from "@iffe/shared";

export function useWithdrawRequests(params?: PaginationParams) {
  return useQuery({
    queryKey: ["withdraw-requests", params],
    queryFn: () => withdrawRequestsApi.getAll(params),
  });
}

export function useCreateWithdrawRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { accountId: string; amount: number; method?: string; reason?: string }) =>
      withdrawRequestsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["withdraw-requests"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useApproveWithdrawRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => withdrawRequestsApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["withdraw-requests"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useRejectWithdrawRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => withdrawRequestsApi.reject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["withdraw-requests"] }),
  });
}
