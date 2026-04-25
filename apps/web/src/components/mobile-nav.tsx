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
        className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        aria-label="Toggle navigation"
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-xl">
          <div className="px-4 py-6 space-y-4">
            <a
              href="#home"
              onClick={() => setOpen(false)}
              className="block text-base font-medium text-text-muted hover:text-primary"
            >
              Home
            </a>
            <a
              href="#about"
              onClick={() => setOpen(false)}
              className="block text-base font-medium text-text-muted hover:text-primary"
            >
              About Us
            </a>
            <a
              href="#services"
              onClick={() => setOpen(false)}
              className="block text-base font-medium text-text-muted hover:text-primary"
            >
              Services
            </a>
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="block text-base font-medium text-text-muted hover:text-primary"
            >
              Contact
            </a>
            <div className="pt-4 border-t border-border">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-all shadow-lg shadow-primary/25"
              >
                Login
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
