import type { Context } from "hono";
import { AuditLogRepository } from "../repositories/audit-log.repository";

const repo = new AuditLogRepository();

function getIpAddress(c: Context) {
  const forwardedFor = c.req.header("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim();
  }

  return c.req.header("x-real-ip") || c.req.header("cf-connecting-ip") || undefined;
}

export async function writeAuditLog(
  c: Context,
  input: {
    action: string;
    entity: string;
    entityId?: string;
    details?: unknown;
    userId?: string;
  },
) {
  const currentUser = c.get("user") as { id?: string } | undefined;
  const userId = input.userId || currentUser?.id;

  if (!userId) {
    return;
  }

  try {
    await repo.create({
      userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      details: input.details,
      ipAddress: getIpAddress(c),
    });
  } catch (error) {
    console.error("Failed to write audit log", error);
  }
}
