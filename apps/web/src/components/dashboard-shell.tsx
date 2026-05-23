"use client";

import { useRef, useState } from "react";
import type { User } from "@iffe/shared";
import { Sidebar } from "@/components/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CommandPalette } from "@/components/ui/command-palette";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { BottomNav } from "@/components/bottom-nav";
import { useAuthStore } from "@/stores/auth-store";

function AuthStateHydrator({ user }: { user: User }) {
  const hydratedFor = useRef<string | undefined>(undefined);
  const currentState = useAuthStore.getState();

  if (hydratedFor.current !== user.id || currentState.user?.id !== user.id || currentState.user?.role !== user.role) {
    useAuthStore.setState({ user, isAuthenticated: true });
    hydratedFor.current = user.id;
  }

  return null;
}

export function DashboardShell({ children, initialUser }: { children: React.ReactNode; initialUser: User }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen mesh-gradient relative">
      <AuthStateHydrator user={initialUser} />
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="blob blob-1 w-[500px] h-[500px] bg-primary/8 -top-40 right-0" />
        <div className="blob blob-2 w-[400px] h-[400px] bg-info/6 bottom-0 -left-20" />
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-72 flex flex-col min-h-screen relative z-10">
        <DashboardHeader onToggleSidebar={() => setSidebarOpen(true)} />
        <main id="main-content" className="flex-1 p-4 lg:p-8 has-bottom-nav">
          <Breadcrumb />
          {children}
        </main>
      </div>

      <BottomNav />
      <CommandPalette />
      <ScrollToTop />
    </div>
  );
}
