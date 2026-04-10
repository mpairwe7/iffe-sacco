"use client";

import { authApi } from "@/lib/api/auth";
import { AUTH_SESSION_COOKIE } from "@/lib/auth-cookie-names";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Best-effort: wipe any client-side traces of the old session before the
 * browser navigates away. We cannot clear httpOnly cookies from JS, but we
 * can clear non-httpOnly shadows, local/session storage, and the in-memory
 * Zustand store. The authoritative cookie deletion happens via the
 * `/auth/logout` response and the middleware's `clearSessionCookie` sweep.
 */
function wipeClientSession() {
  try {
    useAuthStore.getState().clearAuth();
  } catch {
    // ignore
  }

  if (typeof document !== "undefined") {
    // Paranoid fallback: overwrite any same-name cookie on path=/ so that a
    // stale non-httpOnly shadow cannot outlive logout. The real httpOnly
    // session cookie can only be cleared by the server's Set-Cookie header.
    document.cookie = `${AUTH_SESSION_COOKIE}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage?.clear();
      window.sessionStorage?.clear();
    } catch {
      // storage access can throw in some privacy modes — ignore
    }
  }
}

/**
 * Full logout: revoke the session on the server, clear client state, then
 * hard-navigate to `/login` so Next.js's router cache, RSC cache, and all
 * in-memory state are dropped. We deliberately navigate to `/login`
 * (which is covered by middleware) rather than `/`, so that any stale
 * cookie that survives the Set-Cookie response gets swept by the
 * middleware's cookie sweeper on the way in.
 */
export async function logoutUser(redirectTo = "/login") {
  try {
    await authApi.logout();
  } catch {
    // Best effort: the client still needs to clear local auth state even if
    // the network call failed (e.g. offline, server down).
  } finally {
    wipeClientSession();
    if (typeof window !== "undefined") {
      // Hard navigation — this drops the Next.js router cache and any
      // React Query state so we can never accidentally hydrate the new
      // visitor with the previous user's data.
      window.location.replace(redirectTo);
    }
  }
}
