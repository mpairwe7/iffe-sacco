import { apiClient } from "@/lib/api-client";
import type {
  LoginResponse,
  User,
  AuthTokens,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from "@iffe/shared";

export const authApi = {
  login: (data: LoginInput) =>
    apiClient.post<LoginResponse>("/auth/login", data),
  register: (data: RegisterInput) =>
    apiClient.post<LoginResponse>("/auth/register", data),
  refresh: (refreshToken: string) =>
    apiClient.post<AuthTokens>("/auth/refresh", { refreshToken }),
  getMe: () => apiClient.get<User>("/auth/me"),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.patch<void>("/auth/change-password", data),
  updateProfile: (data: UpdateProfileInput) =>
    apiClient.put<User>("/auth/profile", data),
};
