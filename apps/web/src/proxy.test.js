import { describe, expect, it } from "bun:test";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { AUTH_SESSION_COOKIE } from "./lib/auth-cookie-names.ts";
import { proxy, config } from "./proxy.ts";

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

describe("proxy role redirects", () => {
  it("redirects a member from admin dashboard routes to the member portal", async () => {
    const response = await proxy(await createRequest("/dashboard", "member"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/portal/dashboard");
  });

  it("redirects staff away from member portal pages", async () => {
    const response = await proxy(await createRequest("/portal/loans", "staff"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/staff");
  });

  it("redirects admin users away from chairman-only pages", async () => {
    const response = await proxy(await createRequest("/chairman", "admin"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("redirects admin away from /portal subpaths (regression for the isolation bug)", async () => {
    const response = await proxy(await createRequest("/portal/dashboard", "admin"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("redirects admin away from /portal/loans (regression for the isolation bug)", async () => {
    const response = await proxy(await createRequest("/portal/loans", "admin"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("redirects staff away from admin-only /admin/users", async () => {
    const response = await proxy(await createRequest("/admin/users", "staff"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/staff");
  });

  it("allows staff to access shared /admin/expenses", async () => {
    const response = await proxy(await createRequest("/admin/expenses", "staff"));

    expect(response.status).toBe(200);
  });

  it("redirects chairman away from /admin/users (not in chairman allowlist)", async () => {
    const response = await proxy(await createRequest("/admin/users", "chairman"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/chairman");
  });

  it("allows chairman to access /admin/reports", async () => {
    const response = await proxy(await createRequest("/admin/reports", "chairman"));

    expect(response.status).toBe(200);
  });

  it("redirects an authenticated member visiting /login to the member portal", async () => {
    const response = await proxy(await createRequest("/login", "member"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/portal/dashboard");
  });

  it("redirects an unauthenticated visit to a protected route back to /login", async () => {
    const response = await proxy(await createRequest("/dashboard", null));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/login");
  });

  it("clears the session cookie when redirecting an unauthenticated visit", async () => {
    const response = await proxy(await createRequest("/dashboard", null));

    const setCookie = response.headers.get("set-cookie") || "";
    expect(setCookie).toContain(AUTH_SESSION_COOKIE);
    expect(setCookie.toLowerCase()).toContain("max-age=0");
  });

  it("covers staff, chairman, and profile roots in the proxy matcher", () => {
    expect(config.matcher).toContain("/staff");
    expect(config.matcher).toContain("/staff/:path*");
    expect(config.matcher).toContain("/chairman");
    expect(config.matcher).toContain("/chairman/:path*");
    expect(config.matcher).toContain("/profile");
    expect(config.matcher).toContain("/profile/:path*");
  });
});
