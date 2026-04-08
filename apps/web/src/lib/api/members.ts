import { apiClient } from "@/lib/api-client";
import type {
  Member,
  MemberDashboard,
  PaginatedResponse,
  CreateMemberInput,
  UpdateMemberInput,
  PaginationParams,
} from "@iffe/shared";

export const membersApi = {
  getMembers: (params?: PaginationParams) =>
    apiClient.get<PaginatedResponse<Member>>("/members", params),
  getMember: (id: string) => apiClient.get<Member>(`/members/${id}`),
  getMemberDashboard: (id: string) =>
    apiClient.get<MemberDashboard>(`/members/${id}/dashboard`),
  createMember: (data: CreateMemberInput) =>
    apiClient.post<Member>("/members", data),
  updateMember: (id: string, data: UpdateMemberInput) =>
    apiClient.put<Member>(`/members/${id}`, data),
  deleteMember: (id: string) => apiClient.del<void>(`/members/${id}`),
  getMemberStats: () =>
    apiClient.get<Record<string, unknown>>("/members/stats"),
};
