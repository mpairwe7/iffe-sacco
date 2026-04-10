import { apiClient } from "@/lib/api-client";
import type { CreatePaymentGatewayInput, PaymentGateway, UpdatePaymentGatewayInput } from "@iffe/shared";

export const paymentGatewaysApi = {
  getAll: () => apiClient.get<PaymentGateway[]>("/payment-gateways"),
  getById: (id: string) => apiClient.get<PaymentGateway>(`/payment-gateways/${id}`),
  create: (data: CreatePaymentGatewayInput) => apiClient.post<PaymentGateway>("/payment-gateways", data),
  update: (id: string, data: UpdatePaymentGatewayInput) =>
    apiClient.put<PaymentGateway>(`/payment-gateways/${id}`, data),
  toggle: (id: string) => apiClient.patch<PaymentGateway>(`/payment-gateways/${id}/toggle`),
};
