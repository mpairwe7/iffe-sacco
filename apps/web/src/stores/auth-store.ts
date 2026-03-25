import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, AuthTokens } from "@iffe/shared";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, tokens) =>
        set({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, isAuthenticated: true }),
      setTokens: (tokens) =>
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      setUser: (user) => set({ user }),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    { name: "iffe-auth" }
  )
);
