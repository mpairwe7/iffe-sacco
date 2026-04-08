import { apiClient } from "@/lib/api-client";
import type { DepositRequest, PaginatedResponse, PaginationParams } from "@iffe/shared";

export const depositRequestsApi = {
  getAll: (params?: PaginationParams) =>
    apiClient.get<PaginatedResponse<DepositRequest>>("/deposit-requests", params as Record<string, unknown>),
  create: (data: { accountId: string; amount: number; method?: string; description?: string }) =>
    apiClient.post<DepositRequest>("/deposit-requests", data),
  approve: (id: string) =>
    apiClient.patch<DepositRequest>(`/deposit-requests/${id}/approve`),
  reject: (id: string) =>
    apiClient.patch<DepositRequest>(`/deposit-requests/${id}/reject`),
};
