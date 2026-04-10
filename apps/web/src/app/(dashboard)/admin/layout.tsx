import { headers } from "next/headers";
import { requirePathAccess } from "@/lib/server-session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // `/admin/*` is shared by admin, staff, and chairman — but with different
  // subsection access. The per-path guard lives in `canAccessPath` and
  // rejects, for example, chairman trying to open `/admin/users` or a
  // member trying to open any `/admin` page.
  const requestHeaders = await headers();
  const currentPath = requestHeaders.get("x-current-path") || "/admin";
  await requirePathAccess(currentPath);
  return <>{children}</>;
}
