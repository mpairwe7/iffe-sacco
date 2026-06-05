import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, numberedPageButtonCount } from "./helpers";

// Component-level layout resilience. Drives the shared presentational components
// (via the test-only /ui-harness route) with large + edge-case data. No auth/DB,
// so it runs in CI on every PR (tagged @smoke). The Playwright projects supply
// both a desktop and a mobile viewport, so every assertion below runs at both.
test.describe("@smoke ui-harness layout resilience", () => {
  test("DataTable survives 1000 rows + long text + huge amounts", async ({ page }) => {
    await page.goto("/ui-harness?widget=datatable&rows=1000&long=1&bignum=1");
    await expect(page.getByTestId("harness-datatable")).toBeVisible();

    // The page must not overflow horizontally (the table scrolls within its card).
    await expectNoHorizontalOverflow(page, "datatable");

    // Pagination is windowed — never one-button-per-page (the welfare-table bug).
    expect(await numberedPageButtonCount(page)).toBeLessThanOrEqual(7);

    // ...and it actually works: Next advances the visible range.
    await expect(page.getByText(/Showing\s+1-10\s+of\s+1000/)).toBeVisible();
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page.getByText(/Showing\s+11-20\s+of\s+1000/)).toBeVisible();
    await expectNoHorizontalOverflow(page, "datatable after next");
  });

  test("DataTable per-page selector changes the visible range without breaking layout", async ({ page }) => {
    await page.goto("/ui-harness?widget=datatable&rows=1000");
    await page.getByRole("combobox").selectOption("50");
    await expect(page.getByText(/Showing\s+1-50\s+of\s+1000/)).toBeVisible();
    await expectNoHorizontalOverflow(page, "datatable 50/page");
  });

  test("Long cell text is clamped on desktop (truncate), never on the mobile card path", async ({ page }) => {
    await page.goto("/ui-harness?widget=datatable&rows=5&long=1");
    const isMobile = (page.viewportSize()?.width ?? 1280) < 768;
    if (isMobile) {
      // Mobile renders the card view; the only guarantee is no page overflow.
      await expectNoHorizontalOverflow(page, "datatable mobile cards");
      return;
    }
    const nameCell = page
      .locator('[data-testid="harness-datatable"] table tbody tr')
      .first()
      .locator("td")
      .nth(1)
      .locator("span");
    const { scrollWidth, clientWidth } = await nameCell.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    // truncated => content is wider than the (clamped) box, but the box is bounded.
    expect(clientWidth).toBeLessThanOrEqual(16 * 16 + 2); // max-w-[16rem]
    expect(scrollWidth).toBeGreaterThan(clientWidth); // proves it actually overflowed and was clipped
  });

  test("StatCard contains very large values", async ({ page }) => {
    await page.goto("/ui-harness?widget=statcard&value=99,999,999,999,999");
    await expect(page.getByTestId("harness-statcard")).toBeVisible();
    await expectNoHorizontalOverflow(page, "statcard");
  });
});
