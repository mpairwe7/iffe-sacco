"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(e: Event) {
      // Check if user dismissed prompt recently (within 7 days)
      const dismissedUntil = localStorage.getItem("iffe_pwa_dismissed_until");
      if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
        return;
      }

      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    function handleAppInstalled() {
      setVisible(false);
      setDeferredPrompt(null);
      toast.success("IFFE SACCO installed to your device!");
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
        setDeferredPrompt(null);
      }
    } catch {
      toast.error("Installation could not be initiated");
    }
  }

  function handleDismiss() {
    setVisible(false);
    // Dismiss for 7 days
    localStorage.setItem("iffe_pwa_dismissed_until", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  }

  if (!visible || !deferredPrompt) {
    return null;
  }

  return (
    <aside
      role="region"
      aria-label="Install App"
      className="fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border border-primary/20 dark:border-primary/30 rounded-2xl p-4 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-primary/10 ring-2 ring-primary/20 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
          <Image
            src="/icon-192.png"
            alt="IFFE SACCO App"
            width={48}
            height={48}
            className="w-10 h-10 object-contain rounded-lg"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">Install IFFE SACCO</h4>
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              App
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            Fast access, offline mode &amp; alerts
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstall}
            aria-label="Install IFFE SACCO app"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-transform active:scale-95 shadow-md shadow-primary/25 min-h-[38px]"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Install</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss app install prompt"
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
