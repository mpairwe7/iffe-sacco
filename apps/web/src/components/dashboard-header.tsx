"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu, Bell, Search, Globe, User, Settings, LogOut,
  HelpCircle, Sun, Moon, Command, ChevronDown, Clock,
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
    router.push("/login");
  }, [logout, router]);

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
    <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-md border-b border-border/40 flex items-center px-4 lg:px-6 gap-3">
      {/* Left: Mobile menu + Search */}
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2 text-text-muted hover:text-text rounded-lg hover:bg-surface-hover"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search bar — triggers CMD+K palette */}
      <div className="hidden md:flex flex-1 max-w-lg">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full flex items-center gap-3 pl-3.5 pr-3 py-2 bg-surface-alt/80 border border-border/60 rounded-lg text-sm text-text-light hover:border-primary/40 hover:bg-surface-hover transition-colors"
        >
          <Search className="w-4 h-4 shrink-0 text-text-light" />
          <span className="flex-1 text-left truncate">Search members, transactions...</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-surface border border-border/60 rounded text-[10px] font-mono text-text-muted">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>
      </div>

      {/* Mobile search icon */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="md:hidden p-2 text-text-muted hover:text-text rounded-lg hover:bg-surface-hover"
        aria-label="Search"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Spacer pushes right section to extreme right */}
      <div className="flex-1" />

      {/* Right section: theme, language, notifications, profile — spaced evenly */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-text-muted hover:text-text rounded-lg hover:bg-surface-hover transition-colors"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>
        )}

        {/* Language indicator */}
        <button
          className="hidden sm:flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-text-muted hover:text-text rounded-lg hover:bg-surface-hover transition-colors"
          title="Language: English"
          aria-label="Language: English"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>EN</span>
        </button>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-border/50 mx-1" />

        {/* Notifications — dynamic dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2 text-text-muted hover:text-text rounded-lg hover:bg-surface-hover transition-colors"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} new)` : ""}`}
            aria-expanded={notifOpen}
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 bg-danger text-white text-[10px] font-bold rounded-full ring-2 ring-surface">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown panel */}
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface border border-border/60 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
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
        <div className="hidden sm:block w-px h-6 bg-border/50 mx-1" />

        {/* Profile — avatar + name + role + dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
            aria-label="User menu"
            aria-expanded={profileOpen}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center ring-2 ring-primary/20">
              <span className="text-[11px] font-bold text-white">{initials}</span>
            </div>
            <div className="hidden md:block text-left leading-tight">
              <p className="text-sm font-medium text-text truncate max-w-[120px]">{user?.name || "User"}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">{roleBadge}</p>
            </div>
            <ChevronDown className={cn("hidden md:block w-3.5 h-3.5 text-text-light transition-transform", profileOpen && "rotate-180")} />
          </button>

          {/* Profile dropdown */}
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border/60 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/40">
                <p className="text-sm font-semibold text-text">{user?.name || "User"}</p>
                <p className="text-xs text-text-muted truncate">{user?.email || ""}</p>
                <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
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
                <Link href="/portal/help" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:text-text hover:bg-surface-hover transition-colors">
                  <HelpCircle className="w-4 h-4" /> Help & Support
                </Link>
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
