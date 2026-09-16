"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden flex items-center gap-1">
      <ThemeToggle className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800" />
      <button
        onClick={() => setOpen(!open)}
        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Toggle navigation"
        aria-expanded={open}
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {open && (
        <nav
          aria-label="Mobile navigation"
          className="absolute top-full left-0 right-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-xl"
        >
          <div className="px-4 py-6 space-y-2">
            {[
              { href: "#home", label: "Home" },
              { href: "#about", label: "About Us" },
              { href: "#services", label: "Services" },
              { href: "#contact", label: "Contact" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center min-h-[44px] px-3 py-2 text-base font-semibold text-gray-700 dark:text-gray-200 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-all shadow-lg shadow-primary/25"
              >
                Login
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
