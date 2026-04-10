import { expect, test } from "@playwright/test";

/**
 * Auth smoke tests.
 *
 * Depends on an E2E test user provisioned via the seed script. Credentials
 * come from env vars so CI can inject without checking them into source.
 *
 *   E2E_ADMIN_EMAIL=...
 *   E2E_ADMIN_PASSWORD=...
 */
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe("auth flows", () => {
  test.skip(!adminEmail || !adminPassword, "E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD not set");

  test("redirects unauthenticated user to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login with valid creds redirects to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(adminEmail!);
    await page.getByLabel(/password/i).fill(adminPassword!);
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    await expect(page).toHaveURL(/\/(dashboard|chairman|portal|staff)/);
  });

  test("login with wrong password shows error without redirecting", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(adminEmail!);
    await page.getByLabel(/password/i).fill("wrong-password-does-not-match");
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("logout clears the session cookie", async ({ page, context }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(adminEmail!);
    await page.getByLabel(/password/i).fill(adminPassword!);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|chairman|portal|staff)/);

    await page.goto("/logout");
    await expect(page).toHaveURL(/\/login/);

    const cookies = await context.cookies();
    const session = cookies.find((c) => c.name.toLowerCase().includes("session"));
    expect(session?.value || "").toBe("");
  });
});
