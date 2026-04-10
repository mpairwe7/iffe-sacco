import { apiClient } from "@/lib/api-client";
import type {
  BankAccount,
  PaginatedResponse,
  CreateBankAccountInput,
  UpdateBankAccountInput,
  PaginationParams,
} from "@iffe/shared";

export const bankAccountsApi = {
  getBankAccounts: (params?: PaginationParams) =>
    apiClient.get<PaginatedResponse<BankAccount>>("/bank-accounts", params),
  createBankAccount: (data: CreateBankAccountInput) => apiClient.post<BankAccount>("/bank-accounts", data),
  updateBankAccount: (id: string, data: UpdateBankAccountInput) =>
    apiClient.put<BankAccount>(`/bank-accounts/${id}`, data),
  deleteBankAccount: (id: string) => apiClient.del<void>(`/bank-accounts/${id}`),
  getBankAccountStats: () => apiClient.get<Record<string, unknown>>("/bank-accounts/stats"),
};
