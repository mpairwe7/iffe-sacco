import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server-session";
import { getDefaultRouteForRole, type AppRole } from "@/lib/role-routes";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // `/portal/*` is exclusive to members. Staff/chairman/admin are redirected
  // to their own dashboards — this prevents an admin from navigating to
  // `/portal/loans`, `/portal/savings`, etc. after authentication or from
  // landing there via a stale cached link.
  const user = await getCurrentUser();
  if (!user) {
    redirect("/logout");
  }
  if (user.role !== "member") {
    redirect(getDefaultRouteForRole(user.role as AppRole));
  }
  return <>{children}</>;
}
