import { apiClient } from "@/lib/api-client";
import type {
  LoginResponse,
  PasswordResetRequestResponse,
  User,
  ConfirmPasswordResetInput,
  LoginInput,
  RequestPasswordResetInput,
  RegisterInput,
  UpdateProfileInput,
} from "@iffe/shared";

export const authApi = {
  login: (data: LoginInput) => apiClient.post<LoginResponse>("/auth/login", data),
  register: (data: RegisterInput) => apiClient.post<LoginResponse>("/auth/register", data),
  logout: () => apiClient.post<void>("/auth/logout"),
  getMe: () => apiClient.get<User>("/auth/me"),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.patch<void>("/auth/change-password", data),
  updateProfile: (data: UpdateProfileInput) => apiClient.put<User>("/auth/profile", data),
  requestPasswordReset: (data: RequestPasswordResetInput) =>
    apiClient.post<PasswordResetRequestResponse>("/auth/reset-password", data),
  confirmPasswordReset: (data: ConfirmPasswordResetInput) => apiClient.post<void>("/auth/reset-password/confirm", data),
};
