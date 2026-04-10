/**
 * Realtime dashboard — Server-Sent Events with bounded stream duration
 * plus a one-shot snapshot fallback.
 *
 * GET /realtime/dashboard/snapshot
 *   One request, one response. The UI polls this every 10-15 seconds
 *   from any client that prefers polling over an open connection. This
 *   is the recommended path for Fluid Compute — no open sockets, no
 *   timeout concerns, trivial to scale.
 *
 * GET /realtime/dashboard/stream
 *   Short-lived SSE stream (bounded to STREAM_WINDOW_MS, default 240s,
 *   well under the Fluid Compute 300s function limit). Emits an initial
 *   snapshot then up to ~24 updates, closes cleanly, and tells the
 *   browser to reconnect after RECONNECT_MS via the standard SSE
 *   `retry:` directive. The browser seamlessly re-opens the stream, so
 *   the UX is continuous from the user's perspective.
 *
 * Both shapes read directly from Postgres. A follow-up swap this for
 * Vercel Queues or Upstash Redis pub/sub so updates are pushed from
 * the write path instead of sampled from a timer.
 */
// @ts-nocheck
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { authMiddleware, type AuthEnv } from "../middleware/auth";
import { prisma } from "../config/db";
import { Money } from "@iffe/ledger";

const realtime = new Hono<AuthEnv>();
realtime.use("*", authMiddleware);

// Keep well under the 300s Fluid Compute timeout so the function
// returns cleanly and the browser auto-reconnects rather than seeing
// a mid-write abort.
const STREAM_WINDOW_MS = 240_000; // 4 minutes
const SNAPSHOT_INTERVAL_MS = 10_000; // 10s
const RECONNECT_MS = 1_000;

async function loadSnapshot(user: { id: string; memberId?: string | null }) {
  const [accounts, recentTxns, unread] = await Promise.all([
    user.memberId
      ? prisma.account.findMany({
          where: { memberId: user.memberId },
          select: { accountNo: true, type: true, balance: true },
        })
      : Promise.resolve([]),
    prisma.transaction.findMany({
      where: user.memberId ? { account: { memberId: user.memberId } } : { processedBy: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, type: true, amount: true, createdAt: true, description: true },
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);

  return {
    at: new Date().toISOString(),
    accounts: accounts.map((a) => ({
      accountNo: a.accountNo,
      type: a.type,
      balance: Money.toString(Money.fromDb(a.balance)),
    })),
    recentTransactions: recentTxns.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Money.toString(Money.fromDb(t.amount)),
      createdAt: t.createdAt.toISOString(),
      description: t.description,
    })),
    unreadNotifications: unread,
  };
}

// ===== Poll-friendly snapshot (preferred for serverless) =====
realtime.get("/dashboard/snapshot", async (c) => {
  const user = c.get("user");
  const snapshot = await loadSnapshot(user);
  return c.json({ success: true, data: snapshot });
});

// ===== Bounded SSE stream =====
realtime.get("/dashboard/stream", async (c) => {
  const user = c.get("user");

  return streamSSE(c, async (stream) => {
    let aborted = false;
    stream.onAbort(() => {
      aborted = true;
    });

    // Hint to the browser: if the connection drops, wait RECONNECT_MS
    // then reconnect. Standard SSE directive.
    await stream.writeSSE({ data: "", retry: RECONNECT_MS });

    const deadline = Date.now() + STREAM_WINDOW_MS;
    let emissions = 0;
    const maxEmissions = Math.ceil(STREAM_WINDOW_MS / SNAPSHOT_INTERVAL_MS);

    try {
      // Initial snapshot right away.
      await stream.writeSSE({
        event: "snapshot",
        data: JSON.stringify(await loadSnapshot(user)),
      });
      emissions += 1;

      // Subsequent snapshots, bounded by either deadline or count.
      while (!aborted && emissions < maxEmissions && Date.now() < deadline) {
        const remaining = Math.min(SNAPSHOT_INTERVAL_MS, deadline - Date.now());
        if (remaining <= 0) break;
        await stream.sleep(remaining);
        if (aborted || Date.now() >= deadline) break;
        await stream.writeSSE({
          event: "snapshot",
          data: JSON.stringify(await loadSnapshot(user)),
        });
        emissions += 1;
      }

      // Clean close — browser will reconnect automatically.
      await stream.writeSSE({ event: "bye", data: JSON.stringify({ emissions }) });
    } catch {
      // Drop silently; client will reconnect.
    }
  });
});

export { realtime as realtimeRoutes };
