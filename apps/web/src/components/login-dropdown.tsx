"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Shield, Users, Briefcase } from "lucide-react";

export function LoginDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/25"
      >
        Login
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-black/10 border border-border py-2 z-50 animate-in fade-in slide-in-from-top-2">
          <Link
            href="/login?portal=admin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text hover:bg-surface-alt transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            Admin Portal
          </Link>
          <Link
            href="/login?portal=member"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text hover:bg-surface-alt transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-info" />
            </div>
            Member Portal
          </Link>
          <Link
            href="/login?portal=staff"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text hover:bg-surface-alt transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-accent" />
            </div>
            Staff Portal
          </Link>
        </div>
      )}
    </div>
  );
}
