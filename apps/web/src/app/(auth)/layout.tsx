/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden mesh-gradient">
      {/* Animated Blobs */}
      <div className="blob blob-1 w-[500px] h-[500px] bg-primary/20 -top-40 -left-40" />
      <div className="blob blob-2 w-[400px] h-[400px] bg-info/15 top-1/4 -right-32" />
      <div className="blob blob-3 w-[350px] h-[350px] bg-secondary/15 -bottom-20 left-1/4" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="glass rounded-2xl p-2 shadow-lg group-hover:scale-105 transition-transform">
              <img src="/logo.png" alt="IFFE SACCO" className="w-10 h-10 object-contain" />
            </div>
            <span className="text-2xl font-extrabold text-text">IFFE <span className="text-primary">SACCO</span></span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
