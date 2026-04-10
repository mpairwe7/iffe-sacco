import type { ApiResponse } from "@iffe/shared";
import { useAuthStore } from "@/stores/auth-store";
import { enqueue } from "@/lib/offline-queue";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function clearAuth() {
  useAuthStore.getState().clearAuth();
}

/**
 * Read the CSRF token the API dropped in a readable (non-HttpOnly) cookie.
 * Double-submitted as the `X-CSRF-Token` header on mutating requests.
 */
function readCsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  for (const part of document.cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === "csrf-token") return rest.join("=");
  }
  return undefined;
}

function generateIdempotencyKey(): string {
  // 22 base64url chars ≈ 132 bits — plenty for request-level dedupe.
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return btoa(String.fromCharCode(...buf))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function request<T>(
  method: string,
  path: string,
  options?: {
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined | null>;
    idempotent?: boolean;
  },
): Promise<T> {
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

  if (MUTATING_METHODS.has(method)) {
    const csrf = readCsrfToken();
    if (csrf) headers["X-CSRF-Token"] = csrf;
    if (options?.idempotent) {
      headers["Idempotency-Key"] = generateIdempotencyKey();
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
      credentials: "include",
    });
  } catch (networkError) {
    // Offline / network unreachable. For mutations we enqueue the
    // request to IndexedDB and resolve with an optimistic response
    // shape; GETs are left to fail so the caller can render an
    // offline state instead of a phantom success.
    if (MUTATING_METHODS.has(method)) {
      const queued = await enqueue({
        path: url,
        method: method as "POST" | "PUT" | "PATCH" | "DELETE",
        body: options?.body,
        headers,
        summary: `${method} ${path}`,
      });
      const err = new Error(
        "You're offline. This action has been queued and will submit automatically when you reconnect.",
      ) as Error & { offlineQueued?: boolean; queueId?: string };
      err.offlineQueued = true;
      err.queueId = queued.id;
      throw err;
    }
    throw networkError;
  }

  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !json.success) {
    if (res.status === 401) {
      clearAuth();
      if (typeof window !== "undefined" && !path.startsWith("/auth/")) {
        // Route through `/logout` to guarantee the cookie is wiped before
        // the browser lands on `/login`. This protects against the case
        // where the JWT is still verifiable (so middleware would bounce
        // the user back to a dashboard) but the backing DB session was
        // revoked out-of-band (admin revoke, password change, etc.).
        window.location.replace("/logout");
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
  post: <T>(path: string, body?: unknown, opts?: { idempotent?: boolean }) =>
    request<T>("POST", path, { body, idempotent: opts?.idempotent ?? true }),
  put: <T>(path: string, body?: unknown, opts?: { idempotent?: boolean }) =>
    request<T>("PUT", path, { body, idempotent: opts?.idempotent ?? true }),
  patch: <T>(path: string, body?: unknown, opts?: { idempotent?: boolean }) =>
    request<T>("PATCH", path, { body, idempotent: opts?.idempotent ?? true }),
  del: <T>(path: string) => request<T>("DELETE", path),
};
