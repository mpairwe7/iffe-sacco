/**
 * Create (or re-assert) ONE admin account. Non-destructive: upserts only the
 * matching user row, sets role=admin + active. Pass values via env:
 *   ADMIN_EMAIL='admin@iffeds.org' ADMIN_PASSWORD='ChooseAStrongOne!' \
 *   ADMIN_NAME='Site Admin' NODE_ENV=production bun run prisma/create-admin.ts
 */
import { prisma } from "../src/config/db";
import { hashPassword } from "../src/utils/password";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const pw = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Site Admin";
  if (!email || !pw) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD env vars.");
    process.exit(1);
  }

  const password = await hashPassword(pw);
  const user = await prisma.user.upsert({
    where: { email },
    update: { password, role: "admin", isActive: true, name },
    create: { email, name, phone: "+256700000000", password, role: "admin", isActive: true },
    select: { id: true, email: true, role: true },
  });
  console.log(`✓ ${user.email} ready (role=${user.role}). Log in with the password you set.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  });
