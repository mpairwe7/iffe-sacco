import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="blob blob-1 w-[500px] h-[500px] bg-primary/10 -top-40 -left-40" />
        <div className="blob blob-2 w-[400px] h-[400px] bg-info/8 top-1/3 -right-40" />
      </div>
      <div className="relative z-10 text-center max-w-md">
        <div className="glass-card rounded-xl p-10">
          <div className="text-8xl font-extrabold text-primary/20 mb-4">404</div>
          <h1 className="text-2xl font-bold text-text mb-2">Page Not Found</h1>
          <p className="text-text-muted mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-lg hover:shadow-lg hover:shadow-primary/30"
            >
              <Home className="w-4 h-4" /> Go Home
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-text-muted glass rounded-lg hover:bg-white/80"
            >
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
