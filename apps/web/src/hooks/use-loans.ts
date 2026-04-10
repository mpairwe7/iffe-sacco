"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loansApi } from "@/lib/api/loans";
import type { CreateLoanInput, MemberLoanApplicationInput, PaginationParams } from "@iffe/shared";

export function useLoans(params?: PaginationParams) {
  return useQuery({
    queryKey: ["loans", params],
    queryFn: () => loansApi.getLoans(params),
  });
}

export function useLoanStats() {
  return useQuery({
    queryKey: ["loans", "stats"],
    queryFn: loansApi.getLoanStats,
  });
}

export function useCreateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLoanInput) => loansApi.createLoan(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["loans"] }),
  });
}

export function useApplyForLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MemberLoanApplicationInput) => loansApi.applyForLoan(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["members", "me", "dashboard"] });
    },
  });
}

export function useApproveLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => loansApi.approveLoan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loans"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useRejectLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => loansApi.rejectLoan(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["loans"] }),
  });
}
