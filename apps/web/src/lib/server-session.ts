import { headers } from "next/headers";
import type { Application, User } from "@iffe/shared";

async function getBaseUrl() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") || "http";

  if (!host) {
    throw new Error("Missing host header");
  }

  return `${protocol}://${host}`;
}

async function fetchApi<T>(path: string): Promise<T | null> {
  const requestHeaders = await headers();
  const baseUrl = await getBaseUrl();
  const cookie = requestHeaders.get("cookie");

  const response = await fetch(`${baseUrl}/api/v1${path}`, {
    headers: cookie ? { cookie } : undefined,
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  const json = await response.json() as { success: boolean; data?: T; message?: string };
  if (!response.ok || !json.success) {
    throw new Error(json.message || "Request failed");
  }

  return (json.data ?? null) as T | null;
}

export async function getDashboardSession() {
  const requestHeaders = await headers();
  const currentPath = requestHeaders.get("x-current-path") || "/dashboard";
  const user = await fetchApi<User>("/auth/me");

  if (!user) {
    return { user: null, currentPath, application: null as Application | null };
  }

  const application = user.role === "member"
    ? await fetchApi<Application | null>("/applications/mine")
    : null;

  return { user, currentPath, application };
}
