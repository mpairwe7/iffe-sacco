import type { ApiResponse } from "@iffe/shared";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

let refreshPromise: Promise<void> | null = null;

function getAuthStore() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("iffe-auth");
    if (!raw) return null;
    return JSON.parse(raw)?.state as { accessToken?: string; refreshToken?: string } | undefined;
  } catch {
    return null;
  }
}

function setAuthTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("iffe-auth");
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.state.accessToken = accessToken;
      parsed.state.refreshToken = refreshToken;
      localStorage.setItem("iffe-auth", JSON.stringify(parsed));
    }
  } catch { /* ignore */ }
}

function clearAuth() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("iffe-auth");
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.state.user = null;
      parsed.state.accessToken = null;
      parsed.state.refreshToken = null;
      parsed.state.isAuthenticated = false;
      localStorage.setItem("iffe-auth", JSON.stringify(parsed));
    }
  } catch { /* ignore */ }
}

async function refreshTokens(): Promise<void> {
  const store = getAuthStore();
  if (!store?.refreshToken) throw new Error("No refresh token");

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: store.refreshToken }),
  });

  if (!res.ok) throw new Error("Refresh failed");

  const json = await res.json() as ApiResponse<{ accessToken: string; refreshToken: string }>;
  if (!json.success || !json.data) throw new Error("Refresh failed");

  setAuthTokens(json.data.accessToken, json.data.refreshToken);
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

  const store = getAuthStore();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (store?.accessToken) headers["Authorization"] = `Bearer ${store.accessToken}`;

  const res = await fetch(url, {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  // Handle 401 with token refresh
  if (res.status === 401 && store?.refreshToken) {
    if (!refreshPromise) {
      refreshPromise = refreshTokens().finally(() => { refreshPromise = null; });
    }
    try {
      await refreshPromise;
      // Retry with new token
      const newStore = getAuthStore();
      if (newStore?.accessToken) headers["Authorization"] = `Bearer ${newStore.accessToken}`;
      const retryRes = await fetch(url, { method, headers, body: options?.body ? JSON.stringify(options.body) : undefined });
      const retryJson = await retryRes.json() as ApiResponse<T>;
      if (!retryRes.ok || !retryJson.success) throw new Error(retryJson.message || "Request failed");
      return retryJson.data as T;
    } catch {
      clearAuth();
      if (typeof window !== "undefined") window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

  const json = await res.json() as ApiResponse<T>;
  if (!res.ok || !json.success) {
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
