import { describe, expect, it } from "bun:test";
import { roleGroup, assertPortalAllowed, toUser } from "./auth.service.ts";

describe("roleGroup (login portal door per role)", () => {
  it("maps each role to its door; staff + chairman share the staff door", () => {
    expect(roleGroup("member")).toBe("member");
    expect(roleGroup("admin")).toBe("admin");
    expect(roleGroup("staff")).toBe("staff");
    expect(roleGroup("chairman")).toBe("staff");
  });
});

describe("assertPortalAllowed (server-side login door isolation)", () => {
  it("rejects a member signing in through the Admin door", () => {
    expect(() => assertPortalAllowed("member", "admin")).toThrow(/Admin portal/);
  });

  it("rejects a member signing in through the Staff door", () => {
    expect(() => assertPortalAllowed("member", "staff")).toThrow(/Staff portal/);
  });

  it("rejects staff and admin signing in through the Member door", () => {
    expect(() => assertPortalAllowed("staff", "member")).toThrow(/Member portal/);
    expect(() => assertPortalAllowed("admin", "member")).toThrow(/Member portal/);
  });

  it("rejects a chairman through the Admin door (chairman uses the staff door)", () => {
    expect(() => assertPortalAllowed("chairman", "admin")).toThrow(/Admin portal/);
  });

  it("allows each role through its matching door", () => {
    expect(() => assertPortalAllowed("member", "member")).not.toThrow();
    expect(() => assertPortalAllowed("admin", "admin")).not.toThrow();
    expect(() => assertPortalAllowed("staff", "staff")).not.toThrow();
    expect(() => assertPortalAllowed("chairman", "staff")).not.toThrow();
  });

  it("is a no-op when no portal is supplied (API clients without a door)", () => {
    expect(() => assertPortalAllowed("member")).not.toThrow();
    expect(() => assertPortalAllowed("admin", undefined)).not.toThrow();
  });
});

describe("toUser (memberStatus mapping for the pending-nav gate)", () => {
  const base = {
    id: "u-1",
    name: "Jane Doe",
    email: "jane@example.com",
    phone: null,
    role: "member",
    avatar: null,
    isActive: true,
    lastLogin: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  it("surfaces an active member's status", () => {
    expect(toUser({ ...base, member: { status: "active" } }).memberStatus).toBe("active");
  });

  it("surfaces a pending member's status", () => {
    expect(toUser({ ...base, member: { status: "pending" } }).memberStatus).toBe("pending");
  });

  it("is null when the account has no linked member (fresh applicant)", () => {
    expect(toUser({ ...base, member: null }).memberStatus).toBeNull();
    expect(toUser({ ...base }).memberStatus).toBeNull();
  });

  it("defaults mustChangePassword to false", () => {
    expect(toUser({ ...base }).mustChangePassword).toBe(false);
  });
});
