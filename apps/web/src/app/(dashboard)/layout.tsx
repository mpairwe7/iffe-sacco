import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { ForcePasswordChangeModal } from "@/components/modals/force-password-change-modal";
import { getRedirectForPath } from "@/lib/role-routes";
import { getDashboardSession } from "@/lib/server-session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, currentPath, application } = await getDashboardSession();

  if (!user) {
    // IMPORTANT: route through `/logout` (a route handler, NOT in the
    // middleware matcher) so any stale-but-still-verifiable session cookie
    // is hard-deleted before the browser lands on `/login`. Going straight
    // to `/login` would let the middleware re-redirect the user back here
    // and produce an infinite loop when the JWT is still valid but the
    // DB session has been revoked.
    redirect("/logout");
  }

  // Temp-password accounts must set a new password before anything else. Render
  // ONLY the forced-change screen — not the dashboard, whose data fetches are
  // 403-gated server-side until the flag clears. On success the modal calls
  // router.refresh(), this layout re-runs with the flag cleared, and the real
  // dashboard renders.
  if (user.mustChangePassword) {
    return (
      <div className="min-h-screen mesh-gradient">
        <ForcePasswordChangeModal user={user} />
      </div>
    );
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
