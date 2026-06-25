import { describe, expect, test } from "bun:test";
import { buildBreadcrumbs } from "./breadcrumb-helpers";

describe("buildBreadcrumbs", () => {
  test("the 'admin' section root is not clickable (there is no /admin index page)", () => {
    const crumbs = buildBreadcrumbs("/admin/reports");
    expect(crumbs).toEqual([
      { href: "/admin", label: "Admin", isLast: false, clickable: false },
      { href: "/admin/reports", label: "Reports", isLast: true, clickable: false },
    ]);
  });

  test("the 'portal' section root is not clickable either", () => {
    const [portal] = buildBreadcrumbs("/portal/savings");
    expect(portal).toMatchObject({ href: "/portal", label: "Portal", clickable: false });
  });

  test("intermediate mapped segments stay clickable; the last crumb never is", () => {
    const crumbs = buildBreadcrumbs("/admin/members/abc123");
    const members = crumbs.find((c) => c.label === "Members");
    expect(members).toMatchObject({ href: "/admin/members", clickable: true, isLast: false });
    expect(crumbs.at(-1)).toMatchObject({ href: "/admin/members/abc123", isLast: true, clickable: false });
  });

  test("roots with a real index page (e.g. staff) remain navigable", () => {
    const [staff] = buildBreadcrumbs("/staff/members");
    expect(staff).toMatchObject({ label: "Staff", clickable: true });
  });

  test("unmapped segments fall back to a humanized label", () => {
    const last = buildBreadcrumbs("/admin/some-new-thing").at(-1);
    expect(last?.label).toBe("Some new thing");
  });
});
