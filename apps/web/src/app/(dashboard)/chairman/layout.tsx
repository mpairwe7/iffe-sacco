import { requireRole } from "@/lib/server-session";

export default async function ChairmanLayout({ children }: { children: React.ReactNode }) {
  // `/chairman` is exclusive to the chairman role.
  await requireRole(["chairman"]);
  return <>{children}</>;
}
