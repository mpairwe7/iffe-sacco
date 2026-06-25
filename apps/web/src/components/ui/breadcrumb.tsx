"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { buildBreadcrumbs } from "./breadcrumb-helpers";

export function Breadcrumb() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.user?.role);
  const homeHref =
    role === "member"
      ? "/portal/dashboard"
      : role === "chairman"
        ? "/chairman"
        : role === "staff"
          ? "/staff"
          : "/dashboard";

  const crumbs = buildBreadcrumbs(pathname);
  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm mb-6">
      <Link href={homeHref} className="p-1 text-text-light hover:text-primary rounded-md">
        <Home className="w-4 h-4" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5 text-text-light" />
          {crumb.clickable ? (
            <Link href={crumb.href} className="text-text-muted hover:text-primary">
              {crumb.label}
            </Link>
          ) : (
            <span className={crumb.isLast ? "font-medium text-text" : "text-text-muted"}>{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
