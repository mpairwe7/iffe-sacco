import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import type { Context } from "hono";
import { AUTH_COOKIE_NAMES } from "@iffe/shared";
import { env } from "../config/env";

const SESSION_COOKIE_NAME = AUTH_COOKIE_NAMES.SESSION;

export function getSessionDurationMs(remember = false) {
  if (remember) {
    return env.REMEMBER_ME_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
  }

  return env.SESSION_TTL_HOURS * 60 * 60 * 1000;
}

export function getSessionExpiryDate(remember = false) {
  return new Date(Date.now() + getSessionDurationMs(remember));
}

export function setSessionCookie(c: Context, token: string, expiresAt: Date) {
  setCookie(c, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "Strict",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(c: Context) {
  // Delete with the exact attributes used when the cookie was set so every
  // browser drops it on the spot.
  deleteCookie(c, SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "Strict",
    path: "/",
  });
  // Extra belt-and-braces Set-Cookie with an explicit past `expires` — a
  // few client stacks still honour `expires` but not `max-age=0`, so
  // emitting both maximises compatibility.
  setCookie(c, SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "Strict",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

export function getSessionCookie(c: Context) {
  return getCookie(c, SESSION_COOKIE_NAME);
}
