import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getDefaultRouteForRole } from "@/lib/role-routes";
import { getCurrentUser } from "@/lib/server-session";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getDefaultRouteForRole(user.role));
  }

  return <LoginForm />;
}
