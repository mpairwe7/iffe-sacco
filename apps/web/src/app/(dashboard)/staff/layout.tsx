import { requireRole } from "@/lib/server-session";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  // `/staff` is exclusive to the staff role. Admins stay on `/dashboard`,
  // chairman on `/chairman`, members in `/portal/*`.
  await requireRole(["staff"]);
  return <>{children}</>;
}
