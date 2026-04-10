"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { welfareApi } from "@/lib/api/welfare";
import type { CreateWelfareInput, UpdateWelfareInput, PledgeInput, PaginationParams } from "@iffe/shared";

export function useWelfarePrograms(params?: PaginationParams) {
  return useQuery({
    queryKey: ["welfare", params],
    queryFn: () => welfareApi.getPrograms(params),
  });
}

export function useWelfareStats() {
  return useQuery({
    queryKey: ["welfare", "stats"],
    queryFn: welfareApi.getWelfareStats,
  });
}

export function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWelfareInput) => welfareApi.createProgram(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["welfare"] }),
  });
}

export function useUpdateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWelfareInput }) => welfareApi.updateProgram(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["welfare"] }),
  });
}

export function useCreatePledge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PledgeInput) => welfareApi.createPledge(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["welfare"] });
      qc.invalidateQueries({ queryKey: ["pledges"] });
    },
  });
}

export function useMyPledges() {
  return useQuery({
    queryKey: ["pledges", "mine"],
    queryFn: welfareApi.getMyPledges,
  });
}
