import { notFound } from "next/navigation";
import { UiHarness } from "./ui-harness-client";

// Test-only route for layout/pagination resilience checks (Playwright). It renders
// shared presentational components with large / edge-case data driven by query
// params and performs NO data fetching, so it needs neither auth nor a DB. It is
// 404'd in production so it never ships to users, and it lives outside the
// (dashboard)/(auth) route groups so the proxy leaves it alone.
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function UiHarnessPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  if (process.env.NODE_ENV === "production") notFound();

  const sp = await searchParams;
  const get = (key: string) => (Array.isArray(sp[key]) ? sp[key]?.[0] : sp[key]);

  return (
    <UiHarness
      widget={get("widget") ?? "datatable"}
      rows={Number(get("rows") ?? "1000")}
      long={get("long") === "1"}
      bignum={get("bignum") === "1"}
      value={get("value") ?? "1,234,567"}
    />
  );
}
