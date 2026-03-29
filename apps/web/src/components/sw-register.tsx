"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Register service worker after page load for better LCP
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[SW] Registered:", reg.scope);

          // Auto-update check every hour
          setInterval(() => reg.update(), 60 * 60 * 1000);
        })
        .catch((err) => {
          console.warn("[SW] Registration failed:", err);
        });
    });
  }, []);

  return null;
}
