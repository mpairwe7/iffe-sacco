"use client";

/**
 * Live dashboard updates via the bounded /realtime/dashboard/stream SSE
 * endpoint. Handles reconnection automatically using the native
 * EventSource reconnect behaviour (configured by the server via the
 * `retry:` directive).
 *
 * Falls back to /dashboard/snapshot polling if EventSource is
 * unavailable (older browsers, some embedded webviews).
 */
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

export interface DashboardSnapshot {
  at: string;
  accounts: Array<{ accountNo: string; type: string; balance: string }>;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: string;
    createdAt: string;
    description?: string | null;
  }>;
  unreadNotifications: number;
}

export function useDashboardStream() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      // Fallback: polling
      const poll = async () => {
        if (cancelled) return;
        try {
          const data = await apiClient.get<DashboardSnapshot>("/realtime/dashboard/snapshot");
          if (!cancelled) setSnapshot(data);
        } catch {
          // swallow — keep trying
        }
      };
      poll();
      const interval = window.setInterval(poll, 12_000);
      return () => {
        cancelled = true;
        window.clearInterval(interval);
      };
    }

    const es = new EventSource("/api/v1/realtime/dashboard/stream", { withCredentials: true });

    es.addEventListener("snapshot", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        if (!cancelled) setSnapshot(data);
      } catch {
        // ignore
      }
    });

    es.addEventListener("bye", () => {
      // server closed cleanly; EventSource will reconnect automatically
    });

    es.onerror = () => {
      // EventSource retries automatically per the server's retry directive
    };

    return () => {
      cancelled = true;
      es.close();
    };
  }, []);

  return snapshot;
}
