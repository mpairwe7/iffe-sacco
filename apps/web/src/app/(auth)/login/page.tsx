import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getDefaultRouteForRole } from "@/lib/role-routes";
import { getCurrentUser } from "@/lib/server-session";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    // A signed-in but not-yet-active member goes straight to their application
    // status (skipping the portal hop); everyone else to their role's home.
    if (user.role === "member" && user.memberStatus !== "active") {
      redirect("/application-status");
    }
    redirect(getDefaultRouteForRole(user.role));
  }

  return <LoginForm />;
}
