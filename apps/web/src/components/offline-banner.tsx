"use client";

/**
 * OfflineBanner — small, always-visible indicator that flips between
 * three states:
 *
 *   1. online + queue empty → nothing rendered
 *   2. offline             → warning banner with queue depth
 *   3. online + queue > 0  → syncing banner that drains automatically
 */
import { useEffect } from "react";
import { useOfflineQueue } from "@/hooks/use-offline-queue";
import { drain } from "@/lib/offline-queue";

export function OfflineBanner() {
  const { depth, isOnline } = useOfflineQueue();

  useEffect(() => {
    if (isOnline && depth > 0) {
      void drain();
    }
  }, [isOnline, depth]);

  if (isOnline && depth === 0) return null;

  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-amber-500/15 text-amber-900 border-b border-amber-500/30 px-4 py-2 text-sm"
      >
        You&apos;re offline. {depth > 0 ? `${depth} action${depth === 1 ? "" : "s"} will sync when you reconnect.` : "Read-only pages still work from the cache."}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-blue-500/15 text-blue-900 border-b border-blue-500/30 px-4 py-2 text-sm"
    >
      Syncing {depth} pending action{depth === 1 ? "" : "s"}…
    </div>
  );
}
