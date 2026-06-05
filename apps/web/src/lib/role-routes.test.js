import { describe, expect, it } from "bun:test";
import { canAccessPath, getDefaultRouteForRole, getRedirectForPath } from "./role-routes.ts";

describe("getDefaultRouteForRole", () => {
  it("maps each role to its home (admin is the default)", () => {
    expect(getDefaultRouteForRole("admin")).toBe("/dashboard");
    expect(getDefaultRouteForRole("staff")).toBe("/staff");
    expect(getDefaultRouteForRole("chairman")).toBe("/chairman");
    expect(getDefaultRouteForRole("member")).toBe("/portal/dashboard");
    expect(getDefaultRouteForRole(undefined)).toBe("/dashboard");
    expect(getDefaultRouteForRole(null)).toBe("/dashboard");
  });
});

describe("canAccessPath — member isolation", () => {
  it("allows only the member portal and shared profile", () => {
    for (const p of ["/portal", "/portal/dashboard", "/portal/receipts", "/profile"]) {
      expect(canAccessPath(p, "member")).toBe(true);
    }
  });

  it("blocks members from every admin/staff/chairman area", () => {
    for (const p of ["/dashboard", "/admin", "/admin/members", "/admin/applications", "/staff", "/chairman"]) {
      expect(canAccessPath(p, "member")).toBe(false);
    }
  });
});

describe("canAccessPath — staff isolation", () => {
  it("allows the staff dashboard and shared admin sections", () => {
    for (const p of ["/staff", "/staff/anything", "/admin", "/admin/members", "/admin/applications", "/profile"]) {
      expect(canAccessPath(p, "staff")).toBe(true);
    }
  });

  it("blocks staff from admin-only sections and other portals", () => {
    for (const p of [
      "/admin/users",
      "/admin/settings",
      "/admin/interest",
      "/admin/payment-gateways",
      "/admin/bank-accounts",
      "/dashboard",
      "/portal",
      "/chairman",
    ]) {
      expect(canAccessPath(p, "staff")).toBe(false);
    }
  });
});

describe("canAccessPath — chairman isolation", () => {
  it("allows the chairman dashboard and the chairman-allowed admin sections", () => {
    for (const p of [
      "/chairman",
      "/admin/expenses",
      "/admin/reports",
      "/admin/members",
      "/admin/loans",
      "/admin/savings-accounts",
    ]) {
      expect(canAccessPath(p, "chairman")).toBe(true);
    }
  });

  it("blocks chairman from non-allowed admin sections and other portals", () => {
    for (const p of ["/admin/users", "/admin/applications", "/admin/settings", "/staff", "/dashboard", "/portal"]) {
      expect(canAccessPath(p, "chairman")).toBe(false);
    }
  });
});

describe("canAccessPath — admin", () => {
  it("allows the admin dashboard and all admin sections, but not other portals", () => {
    for (const p of ["/dashboard", "/admin", "/admin/users", "/admin/applications", "/profile"]) {
      expect(canAccessPath(p, "admin")).toBe(true);
    }
    for (const p of ["/portal", "/staff", "/chairman"]) {
      expect(canAccessPath(p, "admin")).toBe(false);
    }
  });
});

describe("getRedirectForPath", () => {
  it("sends /login to each role's home", () => {
    expect(getRedirectForPath("/login", "member")).toBe("/portal/dashboard");
    expect(getRedirectForPath("/login", "staff")).toBe("/staff");
    expect(getRedirectForPath("/login", "admin")).toBe("/dashboard");
    expect(getRedirectForPath("/login", "chairman")).toBe("/chairman");
  });

  it("returns null when the path is already allowed for the role", () => {
    expect(getRedirectForPath("/portal/dashboard", "member")).toBeNull();
    expect(getRedirectForPath("/admin/members", "staff")).toBeNull();
    expect(getRedirectForPath("/dashboard", "admin")).toBeNull();
    expect(getRedirectForPath("/profile", "member")).toBeNull();
  });

  it("nudges a member off the portal root to the portal dashboard", () => {
    expect(getRedirectForPath("/portal", "member")).toBe("/portal/dashboard");
  });

  it("redirects a disallowed path to the role's home (cross-portal isolation)", () => {
    expect(getRedirectForPath("/dashboard", "member")).toBe("/portal/dashboard");
    expect(getRedirectForPath("/portal/dashboard", "admin")).toBe("/dashboard");
    expect(getRedirectForPath("/admin/users", "staff")).toBe("/staff");
    expect(getRedirectForPath("/admin/users", "chairman")).toBe("/chairman");
    expect(getRedirectForPath("/staff", "member")).toBe("/portal/dashboard");
  });
});
