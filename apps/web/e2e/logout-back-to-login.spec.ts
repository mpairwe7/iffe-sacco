import { test, expect } from "@playwright/test";

/**
 * Regression coverage for the reported bug:
 *   "This site can't be reached" when clicking **Back to Sign In** after
 *   submitting the membership application.
 *
 * Root cause: the `/logout` route built its 303 `Location` from
 * `new URL(request.url).origin`, which behind a reverse proxy resolves to the
 * internal bind host (e.g. 127.0.0.1:3001) instead of the public domain — so
 * the browser was redirected to an unreachable URL. The fix emits a *relative*
 * `Location` ("/login"), which the browser resolves against the real
 * address-bar origin, so it is always reachable.
 *
 * These tests run against `baseURL` (local dev by default, or
 * PLAYWRIGHT_BASE_URL=https://iffeds.org for the live site).
 */

const PENDING_APPLICATION = {
  id: "e2e-pending",
  fullName: "E2E Applicant",
  phone: "+256700000000",
  status: "pending",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

test.describe("Back to Sign In reachability (logout redirect)", () => {
  test("/logout returns a host-relative redirect even when proxy headers are present", async ({ request }) => {
    // Spoof the forwarded headers that triggered the bug. The fix must never
    // bake an absolute origin into the Location regardless of these.
    const res = await request.get("/logout", {
      headers: { "x-forwarded-host": "internal-bind.invalid", "x-forwarded-proto": "https" },
      maxRedirects: 0,
    });

    expect(res.status()).toBe(303);
    // The crux: a RELATIVE target. The buggy code emitted an absolute URL with
    // the internal/forwarded host (which the user's browser could not reach).
    expect(res.headers()["location"]).toBe("/login");

    // And the session cookie is cleared on the way out.
    const setCookie = res.headersArray().find((h) => h.name.toLowerCase() === "set-cookie")?.value ?? "";
    expect(setCookie).toMatch(/iffe-session=;/);
    expect(setCookie).toMatch(/Max-Age=0/i);
  });

  test("/logout sanitizes the ?to= target (no open redirect) yet keeps same-origin paths", async ({ request }) => {
    const protocolRelative = await request.get("/logout?to=//evil.example/x", { maxRedirects: 0 });
    expect(protocolRelative.headers()["location"]).toBe("/login");

    const backslash = await request.get("/logout?to=/%5Cevil.example", { maxRedirects: 0 });
    expect(backslash.headers()["location"]).toBe("/login");

    const sameOrigin = await request.get("/logout?to=/profile", { maxRedirects: 0 });
    expect(sameOrigin.headers()["location"]).toBe("/profile");
  });

  test("clicking 'Back to Sign In' on the application-status page lands on a reachable /login", async ({
    page,
    baseURL,
  }) => {
    // Render the post-submit status page with a pending application. Mocked, so
    // the test needs no backend and creates no data on the live site.
    await page.route("**/api/v1/**", async (route) => {
      const url = route.request().url();
      const body = url.includes("/applications/mine")
        ? { success: true, data: PENDING_APPLICATION }
        : { success: true, data: null };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    });

    await page.goto("/application-status");

    const backToSignIn = page.getByRole("link", { name: /back to sign in/i });
    await expect(backToSignIn).toBeVisible();

    await backToSignIn.click();

    // The whole point: the browser actually REACHES /login on the same origin.
    // If the redirect pointed at an internal/unreachable host the navigation
    // would fail with a net error instead of arriving here.
    await expect(page).toHaveURL(/\/login(\?.*)?$/, { timeout: 20000 });

    // Where a real backend serves /login (e.g. production), confirm the login
    // form actually rendered — i.e. the page is genuinely reachable, not an
    // error shell.
    if (baseURL?.includes("iffeds.org")) {
      await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible({ timeout: 20000 });
    }
  });
});
