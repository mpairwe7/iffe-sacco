import { apiClient } from "@/lib/api-client";
import type {
  WelfareProgram,
  PaginatedResponse,
  Pledge,
  CreateWelfareInput,
  PledgeInput,
  PaginationParams,
} from "@iffe/shared";

export const welfareApi = {
  getPrograms: (params?: PaginationParams) => apiClient.get<PaginatedResponse<WelfareProgram>>("/welfare", params),
  getProgram: (id: string) => apiClient.get<WelfareProgram>(`/welfare/${id}`),
  createProgram: (data: CreateWelfareInput) => apiClient.post<WelfareProgram>("/welfare", data),
  updateProgram: (id: string, data: Partial<CreateWelfareInput>) =>
    apiClient.put<WelfareProgram>(`/welfare/${id}`, data),
  createPledge: (data: PledgeInput) => apiClient.post<Pledge>("/welfare/pledges", data),
  getMyPledges: () => apiClient.get<Pledge[]>("/welfare/pledges/mine"),
  getWelfareStats: () => apiClient.get<Record<string, unknown>>("/welfare/stats"),
};
