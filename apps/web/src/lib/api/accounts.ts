import { apiClient } from "@/lib/api-client";
import type { Account, PaginatedResponse, PaginationParams } from "@iffe/shared";

export type AccountQueryParams = PaginationParams & {
  memberId?: string;
  type?: string;
  status?: string;
};

export const accountsApi = {
  getAccounts: (params?: AccountQueryParams) => apiClient.get<PaginatedResponse<Account>>("/accounts", params),
  getAccount: (id: string) => apiClient.get<Account>(`/accounts/${id}`),
  getAccountStats: () => apiClient.get<Record<string, unknown>>("/accounts/stats"),
};
