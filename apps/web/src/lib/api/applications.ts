import { apiClient } from "@/lib/api-client";
import type { Application, PaginatedResponse, PaginationParams } from "@iffe/shared";

export const applicationsApi = {
  // Public submit (no auth)
  submit: (data: Record<string, unknown>) => apiClient.post<Application>("/applications", data),
  // Authenticated submit
  submitAuth: (data: Record<string, unknown>) => apiClient.post<Application>("/applications/authenticated", data),
  // Check own status
  getMine: () => apiClient.get<Application | null>("/applications/mine"),
  // Admin list
  getAll: (params?: PaginationParams & { status?: string }) =>
    apiClient.get<PaginatedResponse<Application>>("/applications", params as Record<string, unknown>),
  // Admin stats
  getStats: () =>
    apiClient.get<{
      pending: number;
      approved: number;
      rejected: number;
      total: number;
    }>("/applications/stats"),
  // Admin view detail
  getById: (id: string) => apiClient.get<Application>(`/applications/${id}`),
  // Admin approve
  approve: (id: string) => apiClient.put<Application>(`/applications/${id}/approve`),
  // Admin reject
  reject: (id: string, data: { status: string; rejectionReason?: string }) =>
    apiClient.put<Application>(`/applications/${id}/reject`, data),
};
