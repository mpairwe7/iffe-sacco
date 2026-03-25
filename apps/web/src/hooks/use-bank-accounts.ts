"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bankAccountsApi } from "@/lib/api/bank-accounts";
import type {
  CreateBankAccountInput,
  UpdateBankAccountInput,
  PaginationParams,
} from "@iffe/shared";

export function useBankAccounts(params?: PaginationParams) {
  return useQuery({
    queryKey: ["bank-accounts", params],
    queryFn: () => bankAccountsApi.getBankAccounts(params),
  });
}

export function useBankAccountStats() {
  return useQuery({
    queryKey: ["bank-accounts", "stats"],
    queryFn: bankAccountsApi.getBankAccountStats,
  });
}

export function useCreateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBankAccountInput) =>
      bankAccountsApi.createBankAccount(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bank-accounts"] }),
  });
}

export function useUpdateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateBankAccountInput;
    }) => bankAccountsApi.updateBankAccount(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bank-accounts"] }),
  });
}

export function useDeleteBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bankAccountsApi.deleteBankAccount(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bank-accounts"] }),
  });
}
