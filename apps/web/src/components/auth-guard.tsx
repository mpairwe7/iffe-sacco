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

        // Redirect based on role if on a wrong dashboard
        const pathname = window.location.pathname;

        if (user.role === "chairman" && pathname.startsWith("/dashboard")) {
          router.replace("/chairman");
          return;
        }
        if (user.role === "member" && pathname.startsWith("/admin")) {
          router.replace("/portal/savings");
          return;
        }
        if (user.role === "member" && pathname === "/dashboard") {
          router.replace("/portal/savings");
          return;
        }
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
