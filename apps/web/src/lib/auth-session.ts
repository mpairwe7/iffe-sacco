"use client";

import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";

export async function logoutUser(redirectTo = "/") {
  try {
    await authApi.logout();
  } catch {
    // Best effort: the client still needs to clear local auth state.
  } finally {
    useAuthStore.getState().clearAuth();
    window.location.href = redirectTo;
  }
}
