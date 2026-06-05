import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { ForcePasswordChangeModal } from "@/components/modals/force-password-change-modal";
import { getRedirectForPath } from "@/lib/role-routes";
import { getDashboardSession } from "@/lib/server-session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, currentPath } = await getDashboardSession();

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

  // A member whose membership isn't active yet (pending/rejected applicant, or
  // no member record) belongs on the application-status page — not in the
  // portal, whose pages assume an active Member. Staff-created members are
  // already "active" and pass straight through.
  if (user.role === "member" && user.memberStatus !== "active") {
    redirect("/application-status");
  }

  return <DashboardShell initialUser={user}>{children}</DashboardShell>;
}
