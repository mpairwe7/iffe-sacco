import { apiClient } from "@/lib/api-client";
import type {
  Loan,
  PaginatedResponse,
  CreateLoanInput,
  MemberLoanApplicationInput,
  PaginationParams,
} from "@iffe/shared";

export const loansApi = {
  getLoans: (params?: PaginationParams) => apiClient.get<PaginatedResponse<Loan>>("/loans", params),
  getLoan: (id: string) => apiClient.get<Loan>(`/loans/${id}`),
  createLoan: (data: CreateLoanInput) => apiClient.post<Loan>("/loans", data),
  applyForLoan: (data: MemberLoanApplicationInput) => apiClient.post<Loan>("/loans/apply", data),
  approveLoan: (id: string) => apiClient.patch<Loan>(`/loans/${id}/approve`),
  rejectLoan: (id: string) => apiClient.patch<Loan>(`/loans/${id}/reject`),
  getLoanStats: () => apiClient.get<Record<string, unknown>>("/loans/stats"),
};
