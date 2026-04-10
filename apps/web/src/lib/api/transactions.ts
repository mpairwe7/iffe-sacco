import { apiClient } from "@/lib/api-client";
import type { Transaction, PaginatedResponse, CreateTransactionInput, PaginationParams } from "@iffe/shared";

export const transactionsApi = {
  getTransactions: (params?: PaginationParams) =>
    apiClient.get<PaginatedResponse<Transaction>>("/transactions", params),
  getTransaction: (id: string) => apiClient.get<Transaction>(`/transactions/${id}`),
  createTransaction: (data: CreateTransactionInput) => apiClient.post<Transaction>("/transactions", data),
  approveTransaction: (id: string) => apiClient.patch<Transaction>(`/transactions/${id}/approve`),
  rejectTransaction: (id: string) => apiClient.patch<Transaction>(`/transactions/${id}/reject`),
  getTransactionStats: () => apiClient.get<Record<string, unknown>>("/transactions/stats"),
};
