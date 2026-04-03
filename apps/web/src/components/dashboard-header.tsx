"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu, Bell, Search, Globe, User, Settings, LogOut,
  Sun, Moon, Command, ChevronDown, Clock,
  CheckCircle, AlertCircle, UserPlus, CreditCard, X,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
}

// Map audit actions to icons and colors for the notification panel
function getNotificationMeta(action: string) {
  if (action.includes("login")) return { icon: User, color: "text-primary", bg: "bg-primary/10" };
  if (action.includes("approve")) return { icon: CheckCircle, color: "text-success", bg: "bg-success/10" };
  if (action.includes("reject")) return { icon: AlertCircle, color: "text-danger", bg: "bg-danger/10" };
  if (action.includes("create_member") || action.includes("register")) return { icon: UserPlus, color: "text-info", bg: "bg-info/10" };
  if (action.includes("transaction") || action.includes("deposit") || action.includes("withdraw")) return { icon: CreditCard, color: "text-warning", bg: "bg-warning/10" };
  return { icon: Clock, color: "text-text-muted", bg: "bg-surface-alt" };
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const { data: notifData } = useNotifications(15);

  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount || 0;

  const handleLogout = useCallback(() => {
    logout();
    window.location.href = "/";
  }, [logout]);

  useEffect(() => { setMounted(true); }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
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

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "U";
  const roleBadge = user?.role === "admin" ? "Admin" : user?.role === "chairman" ? "Chairman" : user?.role === "staff" ? "Staff" : "Member";

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm flex items-center px-4 lg:px-6 gap-3">
      {/* Left: Mobile menu */}
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search bar — solid, high contrast, prominent */}
      <div className="hidden md:flex flex-1 max-w-xl">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full flex items-center gap-3 pl-4 pr-3 py-2.5 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-sm transition-all"
        >
          <Search className="w-4 h-4 shrink-0 text-gray-400" />
          <span className="flex-1 text-left truncate text-gray-500 dark:text-gray-400 font-medium">Search members, transactions...</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-[10px] font-mono text-gray-400 shadow-sm">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>
      </div>

      {/* Mobile search icon */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="md:hidden p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Search"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Spacer pushes right section to extreme right */}
      <div className="flex-1" />

      {/* Right section — solid controls, strong contrast */}
      <div className="flex items-center gap-1.5">
        {/* Theme Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>
        )}

        {/* Language indicator */}
        <button
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Language: English"
          aria-label="Language: English"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>EN</span>
        </button>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Notifications — dynamic dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} new)` : ""}`}
            aria-expanded={notifOpen}
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 bg-danger text-white text-[10px] font-bold rounded-full ring-2 ring-white dark:ring-gray-950">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown panel */}
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-text">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="p-1 text-text-light hover:text-text rounded"
                    aria-label="Close notifications"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-border/30">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-8 h-8 text-text-light mx-auto mb-2" />
                    <p className="text-sm text-text-muted">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const meta = getNotificationMeta(n.action);
                    const Icon = meta.icon;
                    return (
                      <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-hover/50 transition-colors">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", meta.bg)}>
                          <Icon className={cn("w-4 h-4", meta.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text leading-snug">
                            <span className="font-medium">{n.user?.name || "System"}</span>{" "}
                            <span className="text-text-muted">{n.action.replace(/_/g, " ")}</span>{" "}
                            <span className="text-text-muted">{n.entity}</span>
                          </p>
                          <p className="text-[11px] text-text-light mt-0.5">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-border/40 text-center">
                  <Link
                    href="/admin/settings"
                    onClick={() => setNotifOpen(false)}
                    className="text-xs font-medium text-primary hover:text-primary-dark"
                  >
                    View all activity
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Profile — avatar + name + role + dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="User menu"
            aria-expanded={profileOpen}
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ring-2 ring-primary/30 shadow-sm">
              <span className="text-[11px] font-black text-white">{initials}</span>
            </div>
            <div className="hidden md:block text-left leading-tight">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">{user?.name || "User"}</p>
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{roleBadge}</p>
            </div>
            <ChevronDown className={cn("hidden md:block w-3.5 h-3.5 text-gray-400 transition-transform", profileOpen && "rotate-180")} />
          </button>

          {/* Profile dropdown */}
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{user?.name || "User"}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
                <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {roleBadge}
                </span>
              </div>
              <div className="py-1">
                <Link href="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:text-text hover:bg-surface-hover transition-colors">
                  <User className="w-4 h-4" /> Profile
                </Link>
                {(user?.role === "admin") && (
                  <Link href="/admin/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:text-text hover:bg-surface-hover transition-colors">
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                )}
              </div>
              <div className="border-t border-border/40 py-1">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/5 transition-colors">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
