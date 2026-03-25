import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse, PaginationParams } from "@iffe/shared";

export const depositRequestsApi = {
  getAll: (params?: PaginationParams) =>
    apiClient.get<PaginatedResponse<any>>("/deposit-requests", params as any),
  create: (data: { accountId: string; amount: number; method?: string; description?: string }) =>
    apiClient.post<any>("/deposit-requests", data),
  approve: (id: string) =>
    apiClient.patch<any>(`/deposit-requests/${id}/approve`),
  reject: (id: string) =>
    apiClient.patch<any>(`/deposit-requests/${id}/reject`),
};
