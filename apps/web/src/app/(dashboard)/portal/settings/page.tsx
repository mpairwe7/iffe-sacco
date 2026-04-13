"use client";

import Link from "next/link";
import { Settings as SettingsIcon, UserRound, Lock, HelpCircle, ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  {
    title: "Edit Profile",
    description: "Update your name, email, phone, and other personal details.",
    href: "/profile",
    icon: UserRound,
  },
  {
    title: "Change Password",
    description: "Set a new password for your account.",
    href: "/profile/change-password",
    icon: Lock,
  },
  {
    title: "Help & Support",
    description: "Browse help articles and get in touch with the SACCO office.",
    href: "/portal/help",
    icon: HelpCircle,
  },
];

export default function PortalSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-text-muted text-sm">Manage your preferences and account security.</p>
        </div>
      </div>

      <section className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text">Theme</p>
            <p className="text-xs text-text-muted mt-0.5">Switch between light and dark mode.</p>
          </div>
          <ThemeToggle className="border border-border hover:bg-surface-alt" />
        </div>
      </section>

      <section className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Account</h2>
        <div className="space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-4 rounded-xl border border-border/60 p-4 hover:bg-surface-alt/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <link.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text">{link.title}</p>
                <p className="text-xs text-text-muted mt-0.5">{link.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
