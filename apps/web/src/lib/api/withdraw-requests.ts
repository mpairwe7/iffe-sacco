import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse, PaginationParams, WithdrawRequest } from "@iffe/shared";

export const withdrawRequestsApi = {
  getAll: (params?: PaginationParams) =>
    apiClient.get<PaginatedResponse<WithdrawRequest>>("/withdraw-requests", params as Record<string, unknown>),
  create: (data: { accountId: string; amount: number; method?: string; reason?: string }) =>
    apiClient.post<WithdrawRequest>("/withdraw-requests", data),
  approve: (id: string) => apiClient.patch<WithdrawRequest>(`/withdraw-requests/${id}/approve`),
  reject: (id: string) => apiClient.patch<WithdrawRequest>(`/withdraw-requests/${id}/reject`),
};
