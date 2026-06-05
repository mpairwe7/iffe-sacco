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
  // Admin/staff stats
  getStats: () =>
    apiClient.get<{
      pending: number;
      recommended: number;
      approved: number;
      rejected: number;
      total: number;
    }>("/applications/stats"),
  // Admin/staff view detail
  getById: (id: string) => apiClient.get<Application>(`/applications/${id}`),
  // Staff recommend (pending → recommended)
  recommend: (id: string, data?: { notes?: string }) =>
    apiClient.put<Application>(`/applications/${id}/recommend`, data ?? {}),
  // Staff decline (pending → rejected, reason required)
  decline: (id: string, data: { reason: string }) => apiClient.put<Application>(`/applications/${id}/decline`, data),
  // Admin approve (recommended → approved)
  approve: (id: string) => apiClient.put<Application>(`/applications/${id}/approve`),
  // Admin reject (pending|recommended → rejected)
  reject: (id: string, data: { status: string; rejectionReason?: string }) =>
    apiClient.put<Application>(`/applications/${id}/reject`, data),
};
