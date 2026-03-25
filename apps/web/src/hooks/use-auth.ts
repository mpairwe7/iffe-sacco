"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import type { LoginInput, RegisterInput, UpdateProfileInput } from "@iffe/shared";

export function useMe() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.getMe,
    retry: false,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginInput) => authApi.login(data),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterInput) => authApi.register(data),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(data),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileInput) => authApi.updateProfile(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth", "me"] }),
  });
}
