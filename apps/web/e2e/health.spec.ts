import { expect, test } from "@playwright/test";

/**
 * Smoke test: the API proxy is reachable and the health check passes.
 * This test runs without auth and is safe to run on every PR preview.
 */
test.describe("health", () => {
  test("GET /api/v1/health returns ok", async ({ request }) => {
    const res = await request.get("/api/v1/health");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
  });

  test("GET /api/v1/health/ready returns ok or 503 with checks", async ({ request }) => {
    const res = await request.get("/api/v1/health/ready");
    // 200 OK in a healthy environment, 503 when the DB can't be reached
    // (still a valid server response). Either is an acceptable shape.
    expect([200, 503]).toContain(res.status());
    const json = await res.json();
    expect(json.checks.database).toBeDefined();
  });

  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
});
