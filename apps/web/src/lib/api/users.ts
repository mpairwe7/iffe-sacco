import { apiClient } from "@/lib/api-client";
import type { User, PaginatedResponse, CreateUserInput, UpdateUserInput, PaginationParams } from "@iffe/shared";

export const usersApi = {
  createUser: (data: CreateUserInput) => apiClient.post<User>("/users", data),
  getUsers: (params?: PaginationParams) => apiClient.get<PaginatedResponse<User>>("/users", params),
  getUser: (id: string) => apiClient.get<User>(`/users/${id}`),
  updateUser: (id: string, data: UpdateUserInput) => apiClient.put<User>(`/users/${id}`, data),
  activateUser: (id: string) => apiClient.patch<User>(`/users/${id}/activate`),
  deactivateUser: (id: string) => apiClient.patch<User>(`/users/${id}/deactivate`),
};
