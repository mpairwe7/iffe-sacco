import bcrypt from "bcryptjs";
import { PASSWORD } from "../../../shared/src";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD.SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
