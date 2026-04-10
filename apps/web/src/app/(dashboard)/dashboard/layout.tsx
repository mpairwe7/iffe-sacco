import { requireRole } from "@/lib/server-session";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  // Only platform admins land on /dashboard. All other roles have their
  // own home (`/staff`, `/chairman`, `/portal/dashboard`) and are
  // redirected away by `requireRole`.
  await requireRole(["admin"]);
  return <>{children}</>;
}
