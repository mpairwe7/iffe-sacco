import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getRedirectForPath } from "@/lib/role-routes";
import { getDashboardSession } from "@/lib/server-session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, currentPath, application } = await getDashboardSession();

  if (!user) {
    redirect("/login");
  }

  const redirectTo = getRedirectForPath(currentPath, user.role);
  if (redirectTo && redirectTo !== currentPath) {
    redirect(redirectTo);
  }

  if (user.role === "member" && application && application.status !== "approved") {
    redirect("/application-status");
  }

  return <DashboardShell initialUser={user}>{children}</DashboardShell>;
}
