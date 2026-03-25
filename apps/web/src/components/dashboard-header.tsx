"use client";

import Link from "next/link";
import { Menu, Bell, Search, Globe, User, Settings, LogOut, HelpCircle, Sun, Moon, Command } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
}

export function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const user = useAuthStore((s) => s.user);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // CMD+K shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setCommandPaletteOpen]);

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "AD";

  return (
    <header className="sticky top-0 z-30 h-16 glass-strong shadow-sm flex items-center px-4 lg:px-8 gap-4">
      <button onClick={onToggleSidebar} className="lg:hidden p-2.5 text-text-muted hover:text-text rounded-xl hover:bg-surface-hover" aria-label="Toggle sidebar">
        <Menu className="w-5 h-5" />
      </button>

      {/* Search - triggers CMD+K */}
      <div className="hidden md:flex flex-1 max-w-md">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full flex items-center gap-3 pl-4 pr-3 py-2 bg-surface-alt border border-border rounded-xl text-sm text-text-light hover:border-primary/30 hover:bg-surface-hover"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left">Search members, transactions...</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-2 py-0.5 bg-white/60 dark:bg-white/10 border border-border rounded-md text-[11px] font-mono text-text-muted">
            <Command className="w-3 h-3" />K
          </kbd>
        </button>
      </div>

      <div className="flex-1 md:hidden" />

      <div className="flex items-center gap-1.5">
        {/* Theme Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2.5 text-text-muted hover:text-text rounded-xl hover:bg-surface-hover"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        )}

        {/* Language */}
        <div className="hidden lg:block relative">
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-muted hover:text-text rounded-xl hover:bg-surface-hover">
            <Globe className="w-4 h-4" />
            EN
          </button>
        </div>

        {/* Notifications */}
        <button className="relative p-2.5 text-text-muted hover:text-text rounded-xl hover:bg-surface-hover" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full ring-2 ring-white dark:ring-gray-900" />
        </button>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-hover"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <span className="hidden md:block text-sm font-medium text-text">{user?.name || "Admin"}</span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 glass-card rounded-2xl py-2 z-50">
              <div className="px-4 py-3 border-b border-border/50 mb-1">
                <p className="text-sm font-semibold text-text">{user?.name || "Admin"}</p>
                <p className="text-xs text-text-muted">{user?.email || "admin@iffeds.org"}</p>
                {user?.lastLogin && (
                  <p className="text-[11px] text-text-light mt-1">
                    Last login: {new Date(user.lastLogin).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
              <Link href="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:text-text hover:bg-surface-hover rounded-lg mx-1">
                <User className="w-4 h-4" /> Profile Settings
              </Link>
              <Link href="/admin/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:text-text hover:bg-surface-hover rounded-lg mx-1">
                <Settings className="w-4 h-4" /> System Settings
              </Link>
              <Link href="/portal/help" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:text-text hover:bg-surface-hover rounded-lg mx-1">
                <HelpCircle className="w-4 h-4" /> Help & Support
              </Link>
              <div className="border-t border-border/50 mt-1 pt-1 mx-1">
                <Link href="/login" className="flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/5 rounded-lg">
                  <LogOut className="w-4 h-4" /> Logout
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
