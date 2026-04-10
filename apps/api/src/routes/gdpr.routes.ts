/**
 * GDPR / Data Protection endpoints.
 *
 * Two operations per data subject:
 *   1. Export — machine-readable dump of every row tagged to the member.
 *   2. Delete — soft-delete + PII anonymization. Financial journal
 *      entries are NEVER deleted (regulatory retention); they are
 *      redacted by pointing at a placeholder "[anonymized]" member.
 *
 * Both operations require admin role and an explicit reason written to
 * the audit log for compliance traceability.
 */
// @ts-nocheck
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod/v4";
import { prisma } from "../config/db";
import { authMiddleware, requireRole } from "../middleware/auth";
import { writeAuditLog } from "../utils/audit";
import { Money } from "@iffe/ledger";

const gdpr = new Hono();
gdpr.use("*", authMiddleware);
gdpr.use("*", requireRole("admin"));

const actionSchema = z.object({
  reason: z.string().min(10, "Reason must explain why this action is justified (min 10 chars)"),
  confirm: z.literal(true),
});

// ============================================================
// GET /gdpr/members/:id/export
// ============================================================
gdpr.get("/members/:id/export", async (c) => {
  const id = c.req.param("id");
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      accounts: { include: { transactions: true } },
      loans: true,
      pledges: { include: { program: { select: { name: true } } } },
      user: { select: { id: true, email: true, role: true, createdAt: true, lastLogin: true } },
      application: true,
    },
  });

  if (!member) throw new HTTPException(404, { message: "Member not found" });

  // Surface ledger movements tagged to this member's accounts.
  const accountIds = member.accounts.map((a) => a.id);
  const journalLines = accountIds.length
    ? await prisma.journalLine.findMany({
        where: { memberAccountId: { in: accountIds } },
        include: { entry: { select: { description: true, occurredAt: true, idempotencyKey: true } } },
        orderBy: { entry: { occurredAt: "asc" } },
      })
    : [];

  await writeAuditLog(c, {
    action: "gdpr_export",
    entity: "member",
    entityId: id,
    details: { reason: "data subject access request", sensitive: true },
  });

  c.header("Content-Disposition", `attachment; filename="member-${member.memberId}-export.json"`);
  return c.json({
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    subject: {
      id: member.id,
      memberId: member.memberId,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      gender: member.gender,
      dateOfBirth: member.dateOfBirth,
      nationalId: member.nationalId,
      occupation: member.occupation,
      address: { street: member.address, city: member.city, district: member.district, country: member.country },
      clan: member.clan,
      totem: member.totem,
      joinDate: member.joinDate,
      status: member.status,
    },
    family: {
      father: member.fatherInfo,
      mother: member.motherInfo,
      spouses: member.spouses,
      children: member.children,
      otherRelatives: member.otherRelatives,
    },
    user: member.user,
    application: member.application,
    accounts: member.accounts.map((a) => ({
      id: a.id,
      accountNo: a.accountNo,
      type: a.type,
      balance: Money.toString(Money.fromDb(a.balance)),
      status: a.status,
      createdAt: a.createdAt,
      transactions: a.transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Money.toString(Money.fromDb(t.amount)),
        description: t.description,
        method: t.method,
        status: t.status,
        createdAt: t.createdAt,
      })),
    })),
    loans: member.loans.map((l) => ({
      id: l.id,
      type: l.type,
      amount: Money.toString(Money.fromDb(l.amount)),
      balance: Money.toString(Money.fromDb(l.balance)),
      status: l.status,
      createdAt: l.createdAt,
    })),
    pledges: member.pledges.map((p) => ({
      id: p.id,
      program: p.program.name,
      pledged: Money.toString(Money.fromDb(p.amount)),
      paid: Money.toString(Money.fromDb(p.paidAmount)),
      status: p.status,
    })),
    ledger: journalLines.map((l) => ({
      occurredAt: l.entry.occurredAt,
      description: l.entry.description,
      accountCode: l.accountCode,
      debit: Money.toString(Money.fromDb(l.debit)),
      credit: Money.toString(Money.fromDb(l.credit)),
    })),
  });
});

// ============================================================
// POST /gdpr/members/:id/delete — soft delete + anonymization
// ============================================================
gdpr.post("/members/:id/delete", zValidator("json", actionSchema), async (c) => {
  const id = c.req.param("id");
  const { reason } = c.req.valid("json");
  const actor = c.get("user");

  const member = await prisma.member.findUnique({
    where: { id },
    include: { user: true, accounts: true, loans: true },
  });

  if (!member) throw new HTTPException(404, { message: "Member not found" });

  // Guard rails: do not allow deletion while financial obligations are open.
  const hasOpenLoan = member.loans.some((l) => ["active", "overdue", "approved"].includes(l.status));
  if (hasOpenLoan) {
    throw new HTTPException(409, {
      message: "Cannot delete member with open loans — settle or write off first",
    });
  }
  const hasNonZeroBalance = member.accounts.some((a) => {
    const bal = Money.fromDb(a.balance);
    return !Money.isZero(bal);
  });
  if (hasNonZeroBalance) {
    throw new HTTPException(409, {
      message: "Cannot delete member with non-zero account balance — close accounts first",
    });
  }

  const anonymizedMarker = `[anonymized-${Date.now()}]`;

  await prisma.$transaction(async (tx) => {
    // Anonymize personal fields on the Member row. Keep the row so
    // historical journal entries still reference a valid id.
    await tx.member.update({
      where: { id },
      data: {
        firstName: anonymizedMarker,
        lastName: "",
        email: `${anonymizedMarker}@deleted.invalid`,
        phone: "",
        gender: null,
        dateOfBirth: null,
        nationalId: null,
        occupation: null,
        address: null,
        city: null,
        district: null,
        clan: null,
        totem: null,
        birthDistrict: null,
        birthVillage: null,
        ancestralDistrict: null,
        ancestralVillage: null,
        residenceDistrict: null,
        residenceVillage: null,
        placeOfWork: null,
        qualifications: null,
        fatherInfo: null,
        motherInfo: null,
        spouses: null,
        children: null,
        otherRelatives: null,
        remarks: null,
        status: "inactive",
      },
    });

    // Deactivate the linked user account and scrub credentials.
    if (member.user) {
      await tx.user.update({
        where: { id: member.user.id },
        data: {
          email: `${anonymizedMarker}@deleted.invalid`,
          phone: null,
          name: anonymizedMarker,
          isActive: false,
        },
      });
      // Revoke all sessions immediately.
      await tx.session.updateMany({
        where: { userId: member.user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    // Close accounts (preserves historical transactions).
    await tx.account.updateMany({
      where: { memberId: id },
      data: { status: "closed" },
    });
  });

  await writeAuditLog(c, {
    action: "gdpr_delete",
    entity: "member",
    entityId: id,
    details: { reason, actorId: actor.id, sensitive: true },
  });

  return c.json({
    success: true,
    message: "Member anonymized. Financial journal entries retained for regulatory compliance.",
    data: { memberId: id, anonymizedMarker },
  });
});

export { gdpr as gdprRoutes };
