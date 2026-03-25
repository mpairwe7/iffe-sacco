import { apiClient } from "@/lib/api-client";
import type {
  Expense,
  PaginatedResponse,
  CreateExpenseInput,
  UpdateExpenseInput,
  PaginationParams,
} from "@iffe/shared";

export const expensesApi = {
  getExpenses: (params?: PaginationParams) =>
    apiClient.get<PaginatedResponse<Expense>>("/expenses", params),
  createExpense: (data: CreateExpenseInput) =>
    apiClient.post<Expense>("/expenses", data),
  updateExpense: (id: string, data: UpdateExpenseInput) =>
    apiClient.put<Expense>(`/expenses/${id}`, data),
  deleteExpense: (id: string) => apiClient.del<void>(`/expenses/${id}`),
  approveExpense: (id: string) =>
    apiClient.patch<Expense>(`/expenses/${id}/approve`),
  rejectExpense: (id: string) =>
    apiClient.patch<Expense>(`/expenses/${id}/reject`),
  getExpenseStats: () =>
    apiClient.get<Record<string, unknown>>("/expenses/stats"),
};
