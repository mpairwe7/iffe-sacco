"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Shield, Users, Briefcase, ChevronDown } from "lucide-react";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-text-muted hover:text-text"
        aria-label="Toggle navigation"
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-border shadow-xl">
          <div className="px-4 py-6 space-y-4">
            <a href="#home" onClick={() => setOpen(false)} className="block text-base font-medium text-text-muted hover:text-primary">Home</a>
            <a href="#about" onClick={() => setOpen(false)} className="block text-base font-medium text-text-muted hover:text-primary">About Us</a>
            <a href="#services" onClick={() => setOpen(false)} className="block text-base font-medium text-text-muted hover:text-primary">Services</a>
            <a href="#contact" onClick={() => setOpen(false)} className="block text-base font-medium text-text-muted hover:text-primary">Contact</a>
            <div className="pt-4 border-t border-border space-y-2">
              <button
                onClick={() => setLoginOpen(!loginOpen)}
                className="w-full flex items-center justify-between px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg"
              >
                Login
                <ChevronDown className={`w-4 h-4 transition-transform ${loginOpen ? "rotate-180" : ""}`} />
              </button>
              {loginOpen && (
                <div className="bg-surface-alt rounded-lg overflow-hidden border border-border">
                  <Link href="/login?portal=admin" onClick={() => setOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-text hover:bg-white border-b border-border">
                    <Shield className="w-4 h-4 text-primary" /> Admin Portal
                  </Link>
                  <Link href="/login?portal=member" onClick={() => setOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-text hover:bg-white border-b border-border">
                    <Users className="w-4 h-4 text-info" /> Member Portal
                  </Link>
                  <Link href="/login?portal=staff" onClick={() => setOpen(false)} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-text hover:bg-white">
                    <Briefcase className="w-4 h-4 text-text-muted" /> Staff Portal
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
