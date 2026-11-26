"use client";

import { useEffect, useState } from "react";
import type { User } from "@iffe/shared";
import { Sidebar } from "@/components/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CommandPalette } from "@/components/ui/command-palette";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { BottomNav } from "@/components/bottom-nav";
import { useAuthStore } from "@/stores/auth-store";

function AuthStateHydrator({ user, onHydrated }: { user: User; onHydrated: (userKey: string) => void }) {
  useEffect(() => {
    const currentUser = useAuthStore.getState().user;
    if (currentUser?.id !== user.id || currentUser.role !== user.role) {
      useAuthStore.setState({ user, isAuthenticated: true });
    }
    onHydrated(`${user.id}:${user.role}`);
  }, [onHydrated, user]);

  return null;
}

export function DashboardShell({ children, initialUser }: { children: React.ReactNode; initialUser: User }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydratedUserKey, setHydratedUserKey] = useState("");
  const currentUserKey = `${initialUser.id}:${initialUser.role}`;
  const isAuthReady = hydratedUserKey === currentUserKey;

  return (
    <div className="min-h-screen mesh-gradient relative">
      <AuthStateHydrator user={initialUser} onHydrated={setHydratedUserKey} />
      {isAuthReady ? (
        <>
          <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <div className="blob blob-1 w-[500px] h-[500px] bg-primary/8 -top-40 right-0" />
            <div className="blob blob-2 w-[400px] h-[400px] bg-info/6 bottom-0 -left-20" />
          </div>

          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="lg:ml-72 flex flex-col min-h-screen relative z-10">
            <DashboardHeader onToggleSidebar={() => setSidebarOpen(true)} />
            <main id="main-content" tabIndex={-1} className="flex-1 p-4 lg:p-8 has-bottom-nav focus:outline-none">
              <Breadcrumb />
              {children}
            </main>
          </div>

          <BottomNav />
          <CommandPalette />
          <ScrollToTop />
        </>
      ) : (
        <div className="grid min-h-screen place-items-center text-sm text-text-muted" role="status">
          Loading dashboard…
        </div>
      )}
    </div>
  );
}
