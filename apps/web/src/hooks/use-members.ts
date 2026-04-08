"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { membersApi } from "@/lib/api/members";
import type {
  CreateMemberInput,
  UpdateMemberInput,
  PaginationParams,
} from "@iffe/shared";

export function useMembers(params?: PaginationParams) {
  return useQuery({
    queryKey: ["members", params],
    queryFn: () => membersApi.getMembers(params),
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: ["members", id],
    queryFn: () => membersApi.getMember(id),
    enabled: !!id,
  });
}

export function useMemberDashboard(id: string) {
  return useQuery({
    queryKey: ["members", id, "dashboard"],
    queryFn: () => membersApi.getMemberDashboard(id),
    enabled: !!id,
  });
}

export function useMemberStats() {
  return useQuery({
    queryKey: ["members", "stats"],
    queryFn: membersApi.getMemberStats,
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMemberInput) => membersApi.createMember(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemberInput }) =>
      membersApi.updateMember(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membersApi.deleteMember(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}
