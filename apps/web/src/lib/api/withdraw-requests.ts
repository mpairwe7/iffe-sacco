import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse, PaginationParams, Transaction } from "@iffe/shared";

export const withdrawRequestsApi = {
  getAll: (params?: PaginationParams) =>
    apiClient.get<PaginatedResponse<Transaction>>("/withdraw-requests", params as Record<string, unknown>),
  create: (data: { accountId: string; amount: number; method?: string; reason?: string }) =>
    apiClient.post<Transaction>("/withdraw-requests", data),
  approve: (id: string) =>
    apiClient.patch<Transaction>(`/withdraw-requests/${id}/approve`),
  reject: (id: string) =>
    apiClient.patch<Transaction>(`/withdraw-requests/${id}/reject`),
};
