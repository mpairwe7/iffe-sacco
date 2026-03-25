import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse, PaginationParams } from "@iffe/shared";

export const withdrawRequestsApi = {
  getAll: (params?: PaginationParams) =>
    apiClient.get<PaginatedResponse<any>>("/withdraw-requests", params as any),
  create: (data: { accountId: string; amount: number; method?: string; reason?: string }) =>
    apiClient.post<any>("/withdraw-requests", data),
  approve: (id: string) =>
    apiClient.patch<any>(`/withdraw-requests/${id}/approve`),
  reject: (id: string) =>
    apiClient.patch<any>(`/withdraw-requests/${id}/reject`),
};
