/**
 * Envelope encryption helper for storing sensitive values (payment gateway
 * credentials, API keys, etc.) in the database.
 *
 * Algorithm: AES-256-GCM with a random 96-bit IV per encryption.
 * Key: `CREDENTIALS_KEK` env var, base64 encoded (must be 32 bytes = 256 bits).
 *
 * Output format (base64): `v1:<iv>:<ciphertext>:<authTag>`
 *
 * NOTE: This is a lightweight envelope — a future upgrade would use a
 * cloud KMS (AWS KMS / GCP KMS / HashiCorp Vault) to wrap per-row DEKs so
 * a single KEK leak doesn't decrypt everything. For a SACCO with a small
 * number of secrets, this is an acceptable starting point provided the
 * KEK lives in Vercel env (not source) and is rotated on suspicion.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const VERSION = "v1";
const KEY_LENGTH = 32;
const IV_LENGTH = 12;

function getKey(): Buffer {
  const raw = process.env.CREDENTIALS_KEK;
  if (!raw) {
    throw new Error("CREDENTIALS_KEK is not set — cannot encrypt/decrypt credentials");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `CREDENTIALS_KEK must be ${KEY_LENGTH} bytes after base64 decode (got ${key.length}). Generate with: openssl rand -base64 ${KEY_LENGTH}`,
    );
  }
  return key;
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64"), ciphertext.toString("base64"), authTag.toString("base64")].join(":");
}

export function decrypt(envelope: string): string {
  const parts = envelope.split(":");
  if (parts.length !== 4) throw new Error("Invalid ciphertext envelope");
  const [version, ivB64, ctB64, tagB64] = parts as [string, string, string, string];
  if (version !== VERSION) throw new Error(`Unknown envelope version: ${version}`);

  const key = getKey();
  const iv = Buffer.from(ivB64, "base64");
  const ciphertext = Buffer.from(ctB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

/**
 * Encrypt a JSON-serializable object. Produces a single envelope string.
 */
export function encryptJson(value: unknown): string {
  return encrypt(JSON.stringify(value));
}

export function decryptJson<T = unknown>(envelope: string): T {
  return JSON.parse(decrypt(envelope)) as T;
}

/**
 * Detect whether a stored credential is already in the encrypted envelope
 * format. Lets services migrate legacy plaintext rows on first decrypt.
 */
export function isEnvelope(value: string): boolean {
  return typeof value === "string" && value.startsWith(`${VERSION}:`) && value.split(":").length === 4;
}
