"use client";

import { useEffect, useState } from "react";
import { count, drain, installAutoDrain, list, subscribe, type QueuedMutation } from "@/lib/offline-queue";

/**
 * useOfflineQueue — observe queue depth + the list of pending mutations.
 *
 * Auto-drains when the browser comes back online. Components can call
 * `refresh()` to force a re-read (e.g. after a successful manual submit).
 */
export function useOfflineQueue() {
  const [depth, setDepth] = useState(0);
  const [pending, setPending] = useState<QueuedMutation[]>([]);
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

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

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    refresh();

    return () => {
      cancelled = true;
      unsub();
      uninstall();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    depth,
    pending,
    isOnline,
    drain,
  };
}
