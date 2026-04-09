import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

async function getNextSequenceValue(db: DbClient, sequenceName: "member_number_seq" | "account_number_seq") {
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
