import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

// Sequence names are spliced into raw SQL via Prisma.raw(), which bypasses
// parameterization. The TypeScript union below is a compile-time check only —
// any caller bypassing the type (JS, dynamic dispatch) could otherwise execute
// arbitrary SQL. Enforce the allowlist at runtime too.
const ALLOWED_SEQUENCES = new Set(["member_number_seq", "account_number_seq"] as const);
type AllowedSequence = "member_number_seq" | "account_number_seq";

async function getNextSequenceValue(db: DbClient, sequenceName: AllowedSequence) {
  if (!ALLOWED_SEQUENCES.has(sequenceName)) {
    throw new Error(`Refusing to splice unknown sequence name into raw SQL: ${sequenceName}`);
  }
  const result = await db.$queryRaw<Array<{ value: bigint | number }>>(
    Prisma.sql`SELECT nextval(${Prisma.raw(`'${sequenceName}'`)})::bigint AS value`,
  );

  const rawValue = result[0]?.value;
  return Number(rawValue ?? 0);
}

export function formatMemberNumber(value: number) {
  return `IFFE-${String(value).padStart(3, "0")}`;
}

export function formatAccountNumber(value: number, type: string) {
  const prefix = type === "current" ? "CUR" : type === "fixed_deposit" ? "FIX" : "SAV";
  return `${prefix}-${String(value).padStart(4, "0")}`;
}

export async function getNextMemberNumber(db: DbClient) {
  return formatMemberNumber(await getNextSequenceValue(db, "member_number_seq"));
}

export async function getNextAccountNumber(db: DbClient, type: string) {
  return formatAccountNumber(await getNextSequenceValue(db, "account_number_seq"), type);
}
