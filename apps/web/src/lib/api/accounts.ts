import { apiClient } from "@/lib/api-client";
import type {
  Account,
  PaginatedResponse,
  PaginationParams,
} from "@iffe/shared";

export const accountsApi = {
  getAccounts: (params?: PaginationParams) =>
    apiClient.get<PaginatedResponse<Account>>("/accounts", params),
  getAccount: (id: string) => apiClient.get<Account>(`/accounts/${id}`),
  getAccountStats: () =>
    apiClient.get<Record<string, unknown>>("/accounts/stats"),
};
