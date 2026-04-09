import type { ApiResponse } from "@iffe/shared";
import { useAuthStore } from "@/stores/auth-store";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

function clearAuth() {
  useAuthStore.getState().clearAuth();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function request<T>(method: string, path: string, options?: { body?: unknown; params?: Record<string, any> }): Promise<T> {
  let url = `${BASE_URL}${path}`;

  if (options?.params) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(options.params)) {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    }
    const str = qs.toString();
    if (str) url += `?${str}`;
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  const res = await fetch(url, {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  });

  const json = await res.json() as ApiResponse<T>;
  if (!res.ok || !json.success) {
    if (res.status === 401) {
      clearAuth();
      if (typeof window !== "undefined" && !path.startsWith("/auth/")) {
        window.location.href = "/login";
      }
    }
    const err = new Error(json.message || "Request failed") as Error & { errors?: Record<string, string[]> };
    err.errors = json.errors;
    throw err;
  }

  return json.data as T;
}

export const apiClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: <T>(path: string, params?: Record<string, any>) => request<T>("GET", path, { params }),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, { body }),
  del: <T>(path: string) => request<T>("DELETE", path),
};
