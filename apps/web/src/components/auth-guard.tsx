"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api/auth";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, setUser, logout } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    // Validate token is still valid
    authApi
      .getMe()
      .then((user) => {
        setUser(user);
        setChecked(true);

        // Comprehensive role-based route protection
        const p = window.location.pathname;
        const role = user.role;

        // Chairman: can only access /chairman and /admin/expenses
        if (role === "chairman") {
          if (p.startsWith("/dashboard")) { router.replace("/chairman"); return; }
          if (p.startsWith("/admin") && !p.startsWith("/admin/expenses") && !p.startsWith("/admin/reports")) {
            router.replace("/chairman"); return;
          }
          if (p.startsWith("/portal")) { router.replace("/chairman"); return; }
        }

        // Member: can only access /portal/*
        if (role === "member") {
          if (p.startsWith("/admin")) { router.replace("/portal/savings"); return; }
          if (p.startsWith("/chairman")) { router.replace("/portal/savings"); return; }
          if (p === "/dashboard") { router.replace("/portal/savings"); return; }
        }

        // Staff: same as admin but no /chairman
        if (role === "staff") {
          if (p.startsWith("/chairman")) { router.replace("/dashboard"); return; }
          if (p.startsWith("/portal")) { router.replace("/dashboard"); return; }
        }

        // Admin: no restrictions (full access)
      })
      .catch(() => {
        logout();
        router.replace("/login");
      });
  }, [isAuthenticated, router, setUser, logout]);

  if (!checked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
