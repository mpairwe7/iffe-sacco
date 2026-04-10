"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationsApi } from "@/lib/api/applications";
import type { PaginationParams } from "@iffe/shared";

export function useApplications(params?: PaginationParams & { status?: string }) {
  return useQuery({
    queryKey: ["applications", params],
    queryFn: () => applicationsApi.getAll(params),
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: ["applications", id],
    queryFn: () => applicationsApi.getById(id),
    enabled: !!id,
  });
}

export function useApplicationStats() {
  return useQuery({
    queryKey: ["applications", "stats"],
    queryFn: applicationsApi.getStats,
  });
}

export function useMyApplication() {
  return useQuery({
    queryKey: ["applications", "mine"],
    queryFn: applicationsApi.getMine,
  });
}

export function useSubmitApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => applicationsApi.submitAuth(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
  });
}

export function useApproveApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applicationsApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useRejectApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      applicationsApi.reject(id, { status: "rejected", rejectionReason: reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
  });
}
