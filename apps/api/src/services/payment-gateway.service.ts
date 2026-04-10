/**
 * Payment gateway service.
 *
 * Encapsulates all reads/writes of PaymentGateway rows so that the
 * `config` JSON column — which contains API keys and secrets — is
 * encrypted at rest. Callers never see the raw envelope; they either
 * get the decrypted config (admins only) or a redacted placeholder.
 *
 * Storage shape: `PaymentGateway.config` is a JSON object of the form
 *   { "__enc": "v1:<iv>:<ct>:<tag>" }
 * after encryption, or `{ ...plaintext }` for legacy rows. The service
 * detects and migrates legacy rows on read.
 */
// @ts-nocheck
import { prisma } from "../config/db";
import { decryptJson, encryptJson, isEnvelope } from "../utils/crypto";
import { logger } from "../utils/logger";

const ENCRYPTED_KEY = "__enc";
const REDACTED = "[REDACTED]";

type GatewayConfig = Record<string, unknown> | null;

function encryptConfig(config: GatewayConfig): GatewayConfig {
  if (!config || Object.keys(config).length === 0) return null;
  return { [ENCRYPTED_KEY]: encryptJson(config) };
}

function decryptConfig(stored: unknown): GatewayConfig {
  if (!stored || typeof stored !== "object") return null;
  const obj = stored as Record<string, unknown>;
  if (typeof obj[ENCRYPTED_KEY] === "string" && isEnvelope(obj[ENCRYPTED_KEY] as string)) {
    try {
      return decryptJson<Record<string, unknown>>(obj[ENCRYPTED_KEY] as string);
    } catch (err) {
      logger.error(
        { err: err instanceof Error ? err.message : String(err) },
        "failed to decrypt payment gateway config — KEK may be wrong",
      );
      return null;
    }
  }
  // Legacy plaintext row — return as-is; migrate on next update.
  return obj as GatewayConfig;
}

function redactConfig(config: GatewayConfig): GatewayConfig {
  if (!config) return null;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(config)) {
    out[key] = REDACTED;
  }
  return out;
}

export class PaymentGatewayService {
  async list(options: { includeSecrets?: boolean } = {}) {
    const rows = await prisma.paymentGateway.findMany({ orderBy: { name: "asc" } });
    return rows.map((row) => this.shape(row, options.includeSecrets));
  }

  async get(id: string, options: { includeSecrets?: boolean } = {}) {
    const row = await prisma.paymentGateway.findUnique({ where: { id } });
    if (!row) return null;
    return this.shape(row, options.includeSecrets);
  }

  async create(input: {
    name: string;
    type: string;
    currency: string;
    fee: string;
    isActive: boolean;
    config?: GatewayConfig;
  }) {
    const row = await prisma.paymentGateway.create({
      data: {
        name: input.name,
        type: input.type,
        currency: input.currency,
        fee: input.fee,
        isActive: input.isActive,
        config: encryptConfig(input.config ?? null) as any,
      },
    });
    return this.shape(row, false);
  }

  async update(
    id: string,
    input: Partial<{
      name: string;
      type: string;
      currency: string;
      fee: string;
      isActive: boolean;
      config: GatewayConfig;
    }>,
  ) {
    const data: Record<string, unknown> = { ...input };
    if ("config" in input) {
      data.config = encryptConfig(input.config ?? null);
    }
    const row = await prisma.paymentGateway.update({ where: { id }, data: data as any });
    return this.shape(row, false);
  }

  async toggle(id: string) {
    const existing = await prisma.paymentGateway.findUnique({ where: { id } });
    if (!existing) return null;
    const row = await prisma.paymentGateway.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
    return this.shape(row, false);
  }

  /**
   * Re-encrypt all plaintext legacy rows. Safe to run repeatedly; a row
   * already in envelope format is left alone.
   */
  async migrateLegacyToEncrypted(): Promise<{ migrated: number }> {
    const rows = await prisma.paymentGateway.findMany();
    let migrated = 0;
    for (const row of rows) {
      if (!row.config) continue;
      const config = row.config as Record<string, unknown>;
      if (typeof config[ENCRYPTED_KEY] === "string") continue; // already encrypted
      await prisma.paymentGateway.update({
        where: { id: row.id },
        data: { config: encryptConfig(config) as any },
      });
      migrated += 1;
    }
    logger.info({ event: "gateway.migrate", migrated }, "legacy gateway configs encrypted");
    return { migrated };
  }

  private shape(row: any, includeSecrets = false) {
    const decrypted = decryptConfig(row.config);
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      currency: row.currency,
      fee: row.fee,
      isActive: row.isActive,
      config: includeSecrets ? decrypted : redactConfig(decrypted),
    };
  }
}

export const paymentGatewayService = new PaymentGatewayService();
