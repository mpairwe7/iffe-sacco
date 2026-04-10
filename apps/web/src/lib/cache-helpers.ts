/**
 * Next.js 16 Cache Components helpers.
 *
 * Use these inside `'use cache'` server components so cache tags and
 * lifetimes are consistent across the app. Prevents the classic mistake
 * of tagging one read with `member:${id}` and another with `members/${id}`
 * — invalidation breaks silently.
 *
 * Usage inside a server component:
 *
 *   'use cache';
 *
 *   import { memberTag, dashboardLife } from "@/lib/cache-helpers";
 *   import { cacheTag, cacheLife } from "next/cache";
 *
 *   export async function MemberCard({ id }: { id: string }) {
 *     cacheTag(memberTag(id));
 *     cacheLife(dashboardLife);
 *     const member = await fetchMember(id);
 *     return <Card>{member.name}</Card>;
 *   }
 *
 * On a mutation, invalidate in a Server Action with:
 *
 *   import { updateTag } from "next/cache";
 *   await updateTag(memberTag(memberId));
 */

// ===== Lifetimes =====
// Keep these conservative — financial UIs are allowed to be stale for a
// few minutes at most. Real-time balances are a UX nicety but not
// required; the cron + WDK invariants are the source of truth.

export const dashboardLife = {
  stale: 60, // 60s serve-stale window
  revalidate: 300, // revalidate every 5 min in the background
  expire: 900, // hard expire after 15 min
} as const;

export const reportsLife = {
  stale: 300,
  revalidate: 1800, // 30 min
  expire: 3600, // 1h
} as const;

export const staticishLife = {
  stale: 3600,
  revalidate: 86400,
  expire: 86400 * 7,
} as const;

// ===== Tags =====

export const memberTag = (id: string) => `member:${id}` as const;
export const membersListTag = () => "members:list" as const;
export const accountTag = (id: string) => `account:${id}` as const;
export const loanTag = (id: string) => `loan:${id}` as const;
export const dashboardTag = (role: string) => `dashboard:${role}` as const;
export const transactionTag = (id: string) => `transaction:${id}` as const;
export const trialBalanceTag = () => "trial-balance" as const;
export const reportTag = (type: string) => `report:${type}` as const;
