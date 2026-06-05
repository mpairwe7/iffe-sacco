import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, loginAs, mockPaginatedList, numberedPageButtonCount, LONG_TEXT } from "./helpers";

// Full-page layout resilience on the REAL pages. These need a running stack with
// a seeded admin (auth + SSR are real); only the client-side LIST fetch is
// ballooned via page.route. Skipped unless E2E_ADMIN_EMAIL/PASSWORD are set
// (e.g. against a seeded local stack or the Postgres-backed CI job), so they stay
// green everywhere else. Tagged @layout. Runs on every configured viewport.
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

const isoEpoch = new Date(0).toISOString();

const cases = [
  {
    name: "members",
    path: "/admin/members",
    resource: "members",
    makeRow: (i: number) => ({
      id: `m-${i}`,
      memberId: `IFFE-${String(i).padStart(4, "0")}`,
      firstName: LONG_TEXT,
      lastName: `#${i}`,
      email: `member.${"x".repeat(40)}.${i}@example-domain-long.co.ug`,
      phone: "+256700000000",
      status: ["active", "pending", "suspended"][i % 3],
      shareCount: 0,
      joinDate: isoEpoch,
      country: "UG",
    }),
  },
  {
    name: "transactions",
    path: "/admin/transactions",
    resource: "transactions",
    makeRow: (i: number) => ({
      id: `txn-${String(i).padStart(6, "0")}-abcdef`,
      type: "deposit",
      amount: "99999999999999",
      status: "completed",
      createdAt: isoEpoch,
      account: { member: { firstName: LONG_TEXT, lastName: `#${i}` } },
    }),
  },
  {
    name: "applications",
    path: "/admin/applications",
    resource: "applications",
    makeRow: (i: number) => ({
      id: `app-${i}`,
      fullName: `${LONG_TEXT} #${i}`,
      phone: "+256700000000",
      email: `applicant.${i}@example.com`,
      status: "recommended",
      createdAt: isoEpoch,
    }),
  },
];

test.describe("@layout real pages survive large datasets", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!adminEmail || !adminPassword, "set E2E_ADMIN_EMAIL/PASSWORD against a seeded stack to run");
    await loginAs(page, adminEmail!, adminPassword!);
  });

  for (const c of cases) {
    test(`${c.name}: 500 rows + long/large fields — no overflow, bounded + working pagination`, async ({ page }) => {
      await mockPaginatedList(page, c.resource, { total: 500, makeRow: c.makeRow });
      await page.goto(c.path);

      await expect(page.getByText(/Showing\s+1-\d+\s+of\s+500/)).toBeVisible({ timeout: 15000 });
      await expectNoHorizontalOverflow(page, c.name);
      expect(await numberedPageButtonCount(page)).toBeLessThanOrEqual(7);

      await page.getByRole("button", { name: "Next page" }).click();
      await expect(page.getByText(/Showing\s+\d+-\d+\s+of\s+500/)).toBeVisible();
      await expectNoHorizontalOverflow(page, `${c.name} (page 2)`);
    });
  }

  const emptyCases = [
    { name: "members", path: "/admin/members", resource: "members", empty: /no\s+(data|members|results)/i },
    {
      name: "transactions",
      path: "/admin/transactions",
      resource: "transactions",
      empty: /no\s+(data|transactions|results)/i,
    },
    {
      name: "applications",
      path: "/admin/applications",
      resource: "applications",
      empty: /no\s+(data|applications|results)/i,
    },
  ];

  for (const c of emptyCases) {
    test(`${c.name}: empty result renders cleanly`, async ({ page }) => {
      await mockPaginatedList(page, c.resource, { total: 0, makeRow: () => ({}) });
      await page.goto(c.path);
      await expect(page.getByText(c.empty)).toBeVisible({ timeout: 15000 });
      await expectNoHorizontalOverflow(page, `empty ${c.name}`);
    });
  }
});
