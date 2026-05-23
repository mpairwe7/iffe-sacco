/**
 * Reset ONE user's password by email. Non-destructive: updates only the
 * matching row. Pass values via env so nothing secret is hard-coded:
 *   ADMIN_EMAIL=admin@iffeds.org NEW_PASSWORD='ChooseAStrongOne!' \
 *     NODE_ENV=production bun run prisma/reset-password.ts
 */
import { prisma } from "../src/config/db";
import { hashPassword } from "../src/utils/password";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const newPassword = process.env.NEW_PASSWORD;
  if (!email || !newPassword) {
    console.error("Set ADMIN_EMAIL and NEW_PASSWORD env vars.");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (!existing) {
    console.error(`No user with email ${email}. Aborting (nothing changed).`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { email },
    data: { password: await hashPassword(newPassword), isActive: true },
  });
  console.log(`✓ Password reset for ${email} (role=${existing.role}). You can now log in with the new password.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  });
