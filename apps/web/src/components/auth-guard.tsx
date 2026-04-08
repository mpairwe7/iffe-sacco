"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api/auth";
import { applicationsApi } from "@/lib/api/applications";
import { Skeleton } from "@/components/ui/skeleton";
import { getRedirectForPath } from "@/lib/role-routes";

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
      .then(async (user) => {
        setUser(user);

        const p = window.location.pathname;
        const redirectTo = getRedirectForPath(p, user.role);
        if (redirectTo) {
          router.replace(redirectTo);
          return;
        }

        if (user.role === "member") {
          try {
            const application = await applicationsApi.getMine();
            if (application && application.status !== "approved") {
              router.replace("/application-status");
              return;
            }
          } catch {
            // No application found — admin-created member, allow access
          }
        }

        setChecked(true);
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
