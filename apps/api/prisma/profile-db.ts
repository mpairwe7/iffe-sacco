/**
 * Read-only snapshot of the database to judge whether it holds real data.
 * Prints row counts per table + a non-sensitive listing of users/members
 * (no password hashes, no secrets). Run from apps/api:
 *   NODE_ENV=production bun run prisma/profile-db.ts
 */
import { prisma } from "../src/config/db";

async function main() {
  const [
    users,
    members,
    accounts,
    transactions,
    loans,
    pledges,
    welfarePrograms,
    applications,
    depositRequests,
    withdrawRequests,
    bankAccounts,
    settings,
    auditLogs,
    sessions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.member.count(),
    prisma.account.count(),
    prisma.transaction.count(),
    prisma.loan.count(),
    prisma.pledge.count(),
    prisma.welfareProgram.count(),
    prisma.application.count(),
    prisma.depositRequest.count(),
    prisma.withdrawRequest.count(),
    prisma.bankAccount.count(),
    prisma.setting.count(),
    prisma.auditLog.count(),
    prisma.session.count(),
  ]);

  console.log("=== ROW COUNTS ===");
  for (const [k, v] of Object.entries({
    users,
    members,
    accounts,
    transactions,
    loans,
    pledges,
    welfarePrograms,
    applications,
    depositRequests,
    withdrawRequests,
    bankAccounts,
    settings,
    auditLogs,
    sessions,
  })) {
    console.log(`${k.padEnd(18)} ${v}`);
  }

  console.log("\n=== USERS (email / role / active / created) ===");
  const us = await prisma.user.findMany({
    select: { email: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  for (const u of us) {
    console.log(
      `${u.role.padEnd(8)} ${u.email.padEnd(30)} active=${u.isActive} created=${u.createdAt.toISOString().slice(0, 10)}`,
    );
  }

  console.log("\n=== MEMBERS (memberId / name / email / created) ===");
  const ms = await prisma.member.findMany({
    select: { memberId: true, firstName: true, lastName: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  for (const m of ms) {
    console.log(
      `${m.memberId.padEnd(10)} ${(m.firstName + " " + m.lastName).padEnd(22)} ${m.email} created=${m.createdAt.toISOString().slice(0, 10)}`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  });
