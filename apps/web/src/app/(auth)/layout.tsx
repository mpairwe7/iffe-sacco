/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-auto mesh-gradient">
      {/* Animated Blobs */}
      <div className="blob blob-1 w-[500px] h-[500px] bg-primary/20 -top-40 -left-40" />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Logo + Brand — solid backing panel for contrast */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-5 group">
            {/* Logo circle with white backing so it pops against any background */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full shadow-2xl group-hover:scale-105 transition-transform ring-4 ring-white/50 dark:ring-white/20 bg-white flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="IFFE SACCO Logo" className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-full" />
            </div>

            {/* Brand text on a frosted pill for maximum readability */}
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl px-8 py-4 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight block">
                <span className="text-primary text-4xl sm:text-5xl font-black">IFFE</span>{" "}
                <span className="text-gray-900 dark:text-white font-extrabold">SACCO</span>
              </span>
              <p className="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-300 tracking-widest uppercase mt-1.5">
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
