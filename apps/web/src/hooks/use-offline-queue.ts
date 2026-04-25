"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { count, drain, installAutoDrain, list, subscribe, type QueuedMutation } from "@/lib/offline-queue";

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

const getOnlineSnapshot = () => navigator.onLine;
// Server snapshot must match the post-hydration online assumption to
// avoid a hydration mismatch (React error #418) when the client is
// offline at first paint.
const getOnlineServerSnapshot = () => true;

/**
 * useOfflineQueue — observe queue depth + the list of pending mutations.
 *
 * Auto-drains when the browser comes back online. Components can call
 * `refresh()` to force a re-read (e.g. after a successful manual submit).
 */
export function useOfflineQueue() {
  const [depth, setDepth] = useState(0);
  const [pending, setPending] = useState<QueuedMutation[]>([]);
  const isOnline = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getOnlineServerSnapshot);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const [d, p] = await Promise.all([count(), list()]);
      if (!cancelled) {
        setDepth(d);
        setPending(p);
      }
    };

    const unsub = subscribe(refresh);
    const uninstall = installAutoDrain();

    refresh();

    return () => {
      cancelled = true;
      unsub();
      uninstall();
    };
  }, []);

  return {
    depth,
    pending,
    isOnline,
    drain,
  };
}
