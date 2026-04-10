"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "@/lib/api/transactions";
import type { CreateTransactionInput, PaginationParams } from "@iffe/shared";

export function useTransactions(params?: PaginationParams) {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () => transactionsApi.getTransactions(params),
  });
}

export function useTransactionStats() {
  return useQuery({
    queryKey: ["transactions", "stats"],
    queryFn: transactionsApi.getTransactionStats,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransactionInput) => transactionsApi.createTransaction(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useApproveTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionsApi.approveTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useRejectTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionsApi.rejectTransaction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
}
