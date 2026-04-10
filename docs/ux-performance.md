# UX & Performance Playbook (Phase 6)

How to apply the Phase 6 primitives across existing routes. Nothing
here is "big rewrite" work — each item is a small, targeted change
a single engineer can land in a half-day.

## 1. Empty states

**Pattern:** `<EmptyState title="…" description="…" action={…} variant="table" />`

**Where to apply**
- Every page under `apps/web/src/app/(dashboard)/**` that renders a DataTable:
  replace the `"—"` placeholder row with `<EmptyState variant="table" />`.
- Member-facing portal pages (`/portal/**`) when no transactions/loans/pledges.
- Admin dashboards when a filter yields no rows.

**Priority pages (most empty during onboarding):**
- `/portal/loans`
- `/portal/welfare`
- `/admin/deposit-requests`
- `/admin/withdraw-requests`
- `/admin/applications`

## 2. Accessible form fields

**Pattern:** `<Field id="…" label="…" error={…}>{child input}</Field>`

`Field` wires label + `aria-describedby` + `aria-invalid` automatically
so every form gets WCAG 2.1 AA compliance without touching each input.

**Where to apply (prioritize high-traffic forms):**
1. `/login` — the single most-used form
2. `/register` multi-step application form
3. `/password/reset` confirm form
4. `/admin/members/create` + `/admin/members/[id]/edit`
5. `/portal/deposits/new` + `/portal/withdrawals/new`
6. `/portal/loans/new`

## 3. Live region announcer

**Pattern:** wrap the dashboard layout once in `<AnnouncerProvider>`, then
call `useAnnouncer()` from any component that wants to announce something.

```tsx
const { announce } = useAnnouncer();
// On success:
announce("Deposit of UGX 250,000 submitted");
// On error:
announce("Deposit failed — please try again", { assertive: true });
```

**Targets:**
- Toast notifications should mirror their message to the announcer.
- Long-running async forms (loan application, member creation).

## 4. Cache Components

**Pattern:** mark the component `"use cache"` at the top of the file,
then call `cacheTag()` and `cacheLife()` using the helpers.

```tsx
"use cache";
import { cacheTag, cacheLife } from "next/cache";
import { dashboardLife, memberTag } from "@/lib/cache-helpers";

export async function MemberSummary({ id }: { id: string }) {
  cacheTag(memberTag(id));
  cacheLife(dashboardLife);
  const data = await apiClient.get(`/members/${id}`);
  return <Card>…</Card>;
}
```

**On mutation**, call `updateTag()` in a Server Action:

```ts
"use server";
import { updateTag } from "next/cache";
import { memberTag, membersListTag } from "@/lib/cache-helpers";

export async function createMember(input: MemberInput) {
  const res = await apiClient.post("/members", input);
  await updateTag(membersListTag());
  await updateTag(memberTag(res.id));
  return res;
}
```

**Targets (order by impact):**
1. Admin members list — currently refetches on every route push
2. Chairman dashboard — mostly read-only aggregations
3. Member portal dashboard — single-member view, cheap to tag
4. Reports pages — long to render, fine to serve a few minutes stale

## 5. Bundle analysis

Run manually before shipping any large UI change:

```bash
ANALYZE=true bun run --filter web build
# then open apps/web/.next/analyze/client.html
```

Watch for:
- `recharts` or `framer-motion` in the main bundle (should be split)
- Any Radix primitive pulled into every route
- Icon tree-shake failures (`lucide-react` should be per-icon imports)

## 6. PWA offline caching

The service worker at `apps/web/public/sw.js` caches:
- Navigations (network-first with `/offline` fallback)
- Static assets (cache-first)
- API reads (network-first with stale fallback)

Enable the flag `pwaOfflineCache` in Edge Config to start serving the
SW in production. Offline mutation queueing is a Phase 7 item.

## Checklist — "Phase 6 applied on a route"

- [ ] Empty state replaces `"—"` placeholder when no data
- [ ] All forms use `<Field>` wrapper
- [ ] Async actions call `announce(...)`
- [ ] Server-component data reads marked `'use cache'` where safe
- [ ] Mutations call `updateTag()`
- [ ] No raw barrel imports from `recharts` / `framer-motion` in client route bundle
