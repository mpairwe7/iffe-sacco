/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-auto mesh-gradient">
      {/* Animated Blobs */}
      <div className="blob blob-1 w-[500px] h-[500px] bg-primary/20 -top-40 -left-40" />
      <div className="blob blob-2 w-[400px] h-[400px] bg-info/15 top-1/4 -right-32" />
      <div className="blob blob-3 w-[350px] h-[350px] bg-secondary/15 -bottom-20 left-1/4" />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex flex-col items-center gap-4 group">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full shadow-xl group-hover:scale-105 transition-transform ring-2 ring-primary/20 flex items-center justify-center overflow-hidden bg-white dark:bg-white/10">
              <img src="/logo.png" alt="IFFE SACCO Logo" className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-full" />
            </div>
            <div className="leading-tight">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
                IFFE <span className="text-primary">SACCO</span>
              </span>
              <p className="text-xs sm:text-sm font-medium text-text-muted tracking-widest uppercase mt-1.5">
                Empowering Financial Freedom
              </p>
            </div>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
