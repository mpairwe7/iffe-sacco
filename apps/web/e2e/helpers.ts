import { expect, type Page } from "@playwright/test";

/**
 * The core "CSS didn't break" invariant: the document must not be wider than the
 * viewport. Wide tables are allowed to scroll inside their own `overflow-x-auto`
 * container, but they must never widen the page itself.
 */
export async function expectNoHorizontalOverflow(page: Page, context = "page") {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `${context} should not overflow horizontally (overflow=${overflow}px)`).toBeLessThanOrEqual(1);
}

/** Number of rendered numbered page buttons (DataTable + welfare table use aria-label="Page N"). */
export async function numberedPageButtonCount(page: Page) {
  return page.getByRole("button", { name: /^Page \d+$/ }).count();
}

/** Log in through the real UI (used by full-page specs that need a real backend). */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await expect(page).toHaveURL(/\/(dashboard|chairman|portal|staff|application-status)/, { timeout: 15000 });
}

interface MockListOptions {
  total: number;
  makeRow: (index: number) => Record<string, unknown>;
  /** Extra top-level keys merged into the JSON body's `data` (e.g. stats). */
  extra?: Record<string, unknown>;
}

/**
 * Intercept a paginated list endpoint (`**​/api/v1/<resource>**`) and return a
 * synthetic page honoring the `page`/`limit` query params, in the API's standard
 * envelope: `{ success, data: { data, total, page, limit, totalPages } }`.
 */
export async function mockPaginatedList(page: Page, resource: string, { total, makeRow, extra }: MockListOptions) {
  await page.route(`**/api/v1/${resource}**`, async (route) => {
    const url = new URL(route.request().url());
    const p = Number(url.searchParams.get("page") || "1");
    const limit = Number(url.searchParams.get("limit") || "20");
    const start = (p - 1) * limit;
    const count = Math.max(0, Math.min(limit, total - start));
    const data = Array.from({ length: count }, (_, i) => makeRow(start + i));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { data, total, page: p, limit, totalPages: Math.max(1, Math.ceil(total / limit)), ...extra },
      }),
    });
  });
}

/** A long, mostly-unbroken string for stressing truncation in cells. */
export const LONG_TEXT = "Nakawombe-Ssemwiri-Wamala".repeat(5);
