import { AUTH_ACCESS_COOKIE, AUTH_REFRESH_COOKIE } from "./auth-cookie-names";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function writeCookie(name: string, value: string, maxAge = COOKIE_MAX_AGE) {
  if (typeof document === "undefined") return;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function syncAuthCookies(tokens: { accessToken: string; refreshToken: string }) {
  writeCookie(AUTH_ACCESS_COOKIE, tokens.accessToken);
  writeCookie(AUTH_REFRESH_COOKIE, tokens.refreshToken);
}

export function clearAuthCookies() {
  writeCookie(AUTH_ACCESS_COOKIE, "", 0);
  writeCookie(AUTH_REFRESH_COOKIE, "", 0);
}
