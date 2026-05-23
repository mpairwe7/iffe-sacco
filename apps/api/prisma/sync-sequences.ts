/**
 * One-off: realign member_number_seq / account_number_seq with the highest
 * existing memberId / accountNo suffix. Needed because the seed inserts those
 * IDs explicitly without advancing the sequences, so nextval() would collide.
 * Idempotent and read-mostly (only setval). Run from apps/api:
 *   NODE_ENV=production bun run prisma/sync-sequences.ts
 */
import { prisma } from "../src/config/db";

function maxSuffix(values: string[]): number {
  let max = 0;
  for (const v of values) {
    const n = parseInt(v.split("-").pop() ?? "", 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return max;
}

async function main() {
  const members = await prisma.member.findMany({ select: { memberId: true } });
  const accounts = await prisma.account.findMany({ select: { accountNo: true } });

  const maxM = maxSuffix(members.map((m) => m.memberId));
  const maxA = maxSuffix(accounts.map((a) => a.accountNo));

  // setval(..., n) leaves is_called=true so the next nextval() returns n+1.
  await prisma.$executeRawUnsafe(`SELECT setval('member_number_seq', ${Math.max(maxM, 1)})`);
  await prisma.$executeRawUnsafe(`SELECT setval('account_number_seq', ${Math.max(maxA, 1)})`);

  console.log(`✓ member_number_seq → ${Math.max(maxM, 1)} (next: ${Math.max(maxM, 1) + 1})`);
  console.log(`✓ account_number_seq → ${Math.max(maxA, 1)} (next: ${Math.max(maxA, 1) + 1})`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  });
