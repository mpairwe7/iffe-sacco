"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "@/lib/api/documents";

export function useMyDocuments() {
  return useQuery({
    queryKey: ["documents", "me"],
    queryFn: documentsApi.myDocuments,
  });
}

export function useMemberDocuments(memberId: string) {
  return useQuery({
    queryKey: ["documents", "member", memberId],
    queryFn: () => documentsApi.memberDocuments(memberId),
    enabled: !!memberId,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => documentsApi.upload(formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}
