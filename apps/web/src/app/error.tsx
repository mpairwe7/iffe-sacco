"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center px-4">
      <div className="relative z-10 text-center max-w-md">
        <div className="glass-card rounded-xl p-10">
          <div className="w-16 h-16 rounded-xl bg-danger/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-danger" />
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">Something went wrong</h1>
          <p className="text-text-muted mb-8">An unexpected error occurred. Please try again.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={reset} className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark">
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            <Link href="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-text-muted glass rounded-lg hover:bg-white/80">
              <Home className="w-4 h-4" /> Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
