import { describe, expect, it } from "bun:test";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { AUTH_SESSION_COOKIE } from "./lib/auth-cookie-names.ts";
import { config, middleware } from "./middleware.ts";

const secret = new TextEncoder().encode("dev-jwt-secret-not-for-production");

async function createToken(role, expiresAt = Math.floor(Date.now() / 1000) + 60 * 60) {
  return new SignJWT({ role, sid: "session-1", sub: "user-1" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresAt)
    .sign(secret);
}

async function createRequest(pathname, role) {
  const headers = new Headers();

  if (role) {
    headers.set("cookie", `${AUTH_SESSION_COOKIE}=${await createToken(role)}`);
  }

  return new NextRequest(`http://localhost${pathname}`, { headers });
}

describe("middleware role redirects", () => {
  it("redirects a member from admin dashboard routes to the member portal", async () => {
    const response = await middleware(await createRequest("/dashboard", "member"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/portal/dashboard");
  });

  it("redirects staff away from member portal pages", async () => {
    const response = await middleware(await createRequest("/portal/loans", "staff"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/staff");
  });

  it("redirects admin users away from chairman-only pages", async () => {
    const response = await middleware(await createRequest("/chairman", "admin"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("allows the login page through so revoked sessions do not loop", async () => {
    const response = await middleware(await createRequest("/login", "member"));

    expect(response.status).toBe(200);
  });

  it("covers staff and chairman roots in the middleware matcher", () => {
    expect(config.matcher).toContain("/staff");
    expect(config.matcher).toContain("/staff/:path*");
    expect(config.matcher).toContain("/chairman");
    expect(config.matcher).toContain("/chairman/:path*");
  });
});
