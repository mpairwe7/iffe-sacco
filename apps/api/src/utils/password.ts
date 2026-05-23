import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { PASSWORD } from "@iffe/shared";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD.SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Human-friendly temporary password: easy to read aloud / type once. Avoids
// ambiguous characters (0/O, 1/l/I) and is long enough to be safe for the brief
// window before the member is forced to change it.
const TEMP_PW_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function generateTempPassword(length = 10): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += TEMP_PW_ALPHABET[randomInt(TEMP_PW_ALPHABET.length)];
  }
  return out;
}
