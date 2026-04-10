"use client";

/**
 * Web Push subscription lifecycle.
 *
 * Usage in a component:
 *
 *   const { status, enable, disable } = usePushSubscription();
 *   <button onClick={enable} disabled={status === 'subscribing'}>
 *     {status === 'subscribed' ? 'Notifications on' : 'Enable notifications'}
 *   </button>
 *
 * Status values:
 *   - 'unsupported'  — browser or device doesn't support push
 *   - 'denied'       — user blocked notifications in the permission prompt
 *   - 'unsubscribed' — idle, ready to enable
 *   - 'subscribing'  — enable() in progress
 *   - 'subscribed'   — active subscription registered with the server
 */
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

type Status = "loading" | "unsupported" | "denied" | "unsubscribed" | "subscribing" | "subscribed";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replaceAll("-", "+").replaceAll("_", "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function usePushSubscription() {
  const [status, setStatus] = useState<Status>("loading");
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }

      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }

      try {
        const res = await apiClient.get<{ publicKey: string }>("/notifications/vapid-public-key");
        setPublicKey(res.publicKey || null);
      } catch {
        setPublicKey(null);
      }

      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setStatus(sub ? "subscribed" : "unsubscribed");
      } catch {
        setStatus("unsupported");
      }
    })();
  }, []);

  const enable = useCallback(async () => {
    if (!publicKey) return;
    setStatus("subscribing");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "unsubscribed");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      await apiClient.post("/notifications/subscribe", {
        endpoint: json.endpoint,
        keys: json.keys,
        userAgent: navigator.userAgent,
      });

      setStatus("subscribed");
    } catch {
      setStatus("unsubscribed");
    }
  }, [publicKey]);

  const disable = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await apiClient.del(`/notifications/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`);
        await sub.unsubscribe();
      }
      setStatus("unsubscribed");
    } catch {
      // leave as-is
    }
  }, []);

  return { status, enable, disable };
}
