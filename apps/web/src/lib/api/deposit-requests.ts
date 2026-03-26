import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse, PaginationParams, Transaction } from "@iffe/shared";

export const depositRequestsApi = {
  getAll: (params?: PaginationParams) =>
    apiClient.get<PaginatedResponse<Transaction>>("/deposit-requests", params as Record<string, unknown>),
  create: (data: { accountId: string; amount: number; method?: string; description?: string }) =>
    apiClient.post<Transaction>("/deposit-requests", data),
  approve: (id: string) =>
    apiClient.patch<Transaction>(`/deposit-requests/${id}/approve`),
  reject: (id: string) =>
    apiClient.patch<Transaction>(`/deposit-requests/${id}/reject`),
};
