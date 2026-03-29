"use client";

import { WifiOff, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-warning" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          You&apos;re Offline
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          It looks like you&apos;ve lost your internet connection. Some features may be unavailable until you reconnect.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => typeof window !== "undefined" && window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors w-full sm:w-auto justify-center"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors w-full sm:w-auto justify-center"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
        <p className="mt-10 text-xs text-gray-400">
          IFFE SACCO — Empowering Financial Freedom
        </p>
      </div>
    </div>
  );
}
