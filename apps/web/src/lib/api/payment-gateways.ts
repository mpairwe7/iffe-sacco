import { apiClient } from "@/lib/api-client";
import type { PaginationParams } from "@iffe/shared";

export const paymentGatewaysApi = {
  getAll: (params?: PaginationParams) =>
    apiClient.get<any>("/payment-gateways", params as any),
  getById: (id: string) =>
    apiClient.get<any>(`/payment-gateways/${id}`),
  create: (data: any) =>
    apiClient.post<any>("/payment-gateways", data),
  update: (id: string, data: any) =>
    apiClient.put<any>(`/payment-gateways/${id}`, data),
  toggle: (id: string) =>
    apiClient.patch<any>(`/payment-gateways/${id}/toggle`),
};
