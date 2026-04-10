import { MemberRepository } from "../repositories/member.repository";
import { prisma } from "../config/db";
import { HTTPException } from "hono/http-exception";
import type {
  Account,
  AccountStatus,
  AccountType,
  CreateMemberInput,
  MemberDashboard,
  PaginationInput,
  TransactionStatus,
  TransactionType,
} from "@iffe/shared";
import { INTEREST_RATES } from "@iffe/shared";
import { getNextAccountNumber, getNextMemberNumber } from "../utils/identifiers";

const repo = new MemberRepository();
const ACTIVE_LOAN_STATUSES = ["approved", "active", "overdue", "defaulted"] as const;

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function toIsoString(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}

export class MemberService {
  async getAll(params: PaginationInput) {
    return repo.findAll(params);
  }

  async getById(id: string) {
    const member = await repo.findById(id);
    if (!member) throw new HTTPException(404, { message: "Member not found" });
    return member;
  }

  async create(input: CreateMemberInput) {
    // Check for duplicate email
    const existing = await prisma.member.findFirst({ where: { email: input.email } });
    if (existing) throw new HTTPException(409, { message: "A member with this email already exists" });

    return prisma.$transaction(async (tx) => {
      const member = await tx.member.create({
        data: {
          memberId: await getNextMemberNumber(tx),
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          gender: input.gender,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
          nationalId: input.nationalId,
          occupation: input.occupation,
          address: input.address,
          city: input.city,
          district: input.district,
          country: input.country,
          shareCount: input.shareCount ?? 0,
          weddingSupportStatus: input.weddingSupportStatus,
          weddingSupportDebt: input.weddingSupportDebt ?? 0,
          condolenceSupportStatus: input.condolenceSupportStatus,
          condolenceSupportDebt: input.condolenceSupportDebt ?? 0,
          remarks: input.remarks,
          status: "pending",
        },
      });

      const rate = INTEREST_RATES[input.accountType as keyof typeof INTEREST_RATES] || 12;

      await tx.account.create({
        data: {
          accountNo: await getNextAccountNumber(tx, input.accountType),
          memberId: member.id,
          type: input.accountType,
          balance: input.initialDeposit || 0,
          interestRate: rate,
          status: "active",
        },
      });

      return member;
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    await this.getById(id); // ensures exists

    const payload: Record<string, unknown> = { ...data };

    if ("dateOfBirth" in data) {
      payload.dateOfBirth = data.dateOfBirth ? new Date(String(data.dateOfBirth)) : null;
    }
    if ("shareCount" in data && data.shareCount !== undefined) {
      payload.shareCount = Number(data.shareCount);
    }
    if ("weddingSupportDebt" in data && data.weddingSupportDebt !== undefined) {
      payload.weddingSupportDebt = Number(data.weddingSupportDebt);
    }
    if ("condolenceSupportDebt" in data && data.condolenceSupportDebt !== undefined) {
      payload.condolenceSupportDebt = Number(data.condolenceSupportDebt);
    }
    if ("remarks" in data) {
      payload.remarks = data.remarks ? String(data.remarks) : null;
    }

    return repo.update(id, payload);
  }

  async delete(id: string) {
    await this.getById(id);
    return repo.delete(id);
  }

  async getStats() {
    return repo.countByStatus();
  }

  async getDashboard(id: string): Promise<MemberDashboard> {
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        accounts: {
          orderBy: { createdAt: "asc" },
        },
        loans: {
          where: { status: { in: [...ACTIVE_LOAN_STATUSES] } },
          orderBy: { createdAt: "desc" },
        },
        pledges: {
          include: { program: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!member) {
      throw new HTTPException(404, { message: "Member not found" });
    }

    const accountIds = member.accounts.map((account) => account.id);
    const transactionWhere = accountIds.length > 0 ? { accountId: { in: accountIds } } : undefined;

    // Parallel reads via Promise.all instead of prisma.$transaction([...]).
    // The API runs on Vercel Functions with PrismaNeonHttp which cannot
    // do multi-statement transactions in either callback or batch form.
    // These are all read-only SELECTs — atomicity isn't required
    // (dashboard data tolerates being milliseconds apart across queries).
    const [recentTransactions, firstDeposit, latestDeposit, totalDeposits, totalWithdrawals, monthlySubscriptionTotal] =
      accountIds.length > 0
        ? await Promise.all([
            prisma.transaction.findMany({
              where: transactionWhere,
              orderBy: { createdAt: "desc" },
              take: 12,
            }),
            prisma.transaction.findFirst({
              where: { ...transactionWhere, type: "deposit", status: "completed" },
              orderBy: { createdAt: "asc" },
            }),
            prisma.transaction.findFirst({
              where: { ...transactionWhere, type: "deposit", status: "completed" },
              orderBy: { createdAt: "desc" },
            }),
            prisma.transaction.aggregate({
              where: { ...transactionWhere, type: "deposit", status: "completed" },
              _sum: { amount: true },
              _count: true,
            }),
            prisma.transaction.aggregate({
              where: { ...transactionWhere, type: "withdrawal", status: "completed" },
              _sum: { amount: true },
            }),
            prisma.transaction.aggregate({
              where: {
                ...transactionWhere,
                status: "completed",
                OR: [
                  { description: { contains: "subscription", mode: "insensitive" } },
                  { description: { contains: "monthly", mode: "insensitive" } },
                  { reference: { contains: "subscription", mode: "insensitive" } },
                  { reference: { contains: "monthly", mode: "insensitive" } },
                ],
              },
              _sum: { amount: true },
            }),
          ])
        : [[], null, null, { _sum: { amount: 0 }, _count: 0 }, { _sum: { amount: 0 } }, { _sum: { amount: 0 } }];

    const accountLookup = new Map<string, Account>(
      member.accounts.map((account) => [
        account.id,
        {
          id: account.id,
          accountNo: account.accountNo,
          memberId: account.memberId,
          type: account.type as AccountType,
          balance: toNumber(account.balance),
          interestRate: toNumber(account.interestRate),
          status: account.status as AccountStatus,
          lastActivity: toIsoString(account.lastActivity),
          createdAt: toIsoString(account.createdAt) ?? new Date().toISOString(),
        },
      ]),
    );

    const serializedAccounts = Array.from(accountLookup.values());
    const activePledges = member.pledges.filter((pledge) => pledge.status !== "cancelled");

    return {
      member: {
        id: member.id,
        memberId: member.memberId,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        gender: member.gender,
        dateOfBirth: toIsoString(member.dateOfBirth),
        nationalId: member.nationalId,
        occupation: member.occupation,
        address: member.address,
        city: member.city,
        district: member.district,
        country: member.country,
        status: member.status as "active" | "pending" | "inactive" | "suspended",
        joinDate: toIsoString(member.joinDate) ?? new Date().toISOString(),
        userId: member.userId,
        shareCount: member.shareCount ?? 0,
        weddingSupportStatus: member.weddingSupportStatus as "received" | "requested" | "not_received",
        weddingSupportDebt: toNumber(member.weddingSupportDebt),
        condolenceSupportStatus: member.condolenceSupportStatus as "received" | "requested" | "not_received",
        condolenceSupportDebt: toNumber(member.condolenceSupportDebt),
        remarks: member.remarks,
        clan: member.clan,
        totem: member.totem,
        birthDistrict: member.birthDistrict,
        birthVillage: member.birthVillage,
        ancestralDistrict: member.ancestralDistrict,
        ancestralVillage: member.ancestralVillage,
        residenceDistrict: member.residenceDistrict,
        residenceVillage: member.residenceVillage,
        placeOfWork: member.placeOfWork,
        qualifications: member.qualifications,
        fatherInfo: member.fatherInfo as Record<string, unknown> | null,
        motherInfo: member.motherInfo as Record<string, unknown> | null,
        spouses: member.spouses as Record<string, unknown>[] | null,
        children: member.children as Record<string, unknown>[] | null,
        otherRelatives: member.otherRelatives as Record<string, unknown>[] | null,
        applicationId: member.applicationId,
        createdAt: toIsoString(member.createdAt) ?? new Date().toISOString(),
        updatedAt: toIsoString(member.updatedAt) ?? new Date().toISOString(),
      },
      accounts: serializedAccounts,
      recentTransactions: recentTransactions.map((transaction) => ({
        id: transaction.id,
        accountId: transaction.accountId,
        type: transaction.type as TransactionType,
        amount: toNumber(transaction.amount),
        description: transaction.description,
        method: transaction.method,
        reference: transaction.reference,
        status: transaction.status as TransactionStatus,
        processedBy: transaction.processedBy,
        createdAt: toIsoString(transaction.createdAt) ?? new Date().toISOString(),
        account: accountLookup.get(transaction.accountId),
      })),
      pledges: member.pledges.map((pledge) => ({
        id: pledge.id,
        programId: pledge.programId,
        memberId: pledge.memberId,
        amount: toNumber(pledge.amount),
        status: pledge.status as "pledged" | "paid" | "cancelled",
        createdAt: toIsoString(pledge.createdAt) ?? new Date().toISOString(),
        program: pledge.program
          ? {
              id: pledge.program.id,
              name: pledge.program.name,
              description: pledge.program.description,
              targetAmount: toNumber(pledge.program.targetAmount),
              raisedAmount: toNumber(pledge.program.raisedAmount),
              contributorCount: pledge.program.contributorCount,
              status: pledge.program.status as "active" | "completed" | "paused",
              createdAt: toIsoString(pledge.program.createdAt) ?? new Date().toISOString(),
            }
          : undefined,
      })),
      transactionSummary: {
        totalDeposits: toNumber(totalDeposits._sum.amount),
        totalWithdrawals: toNumber(totalWithdrawals._sum.amount),
        monthlySubscriptionTotal: toNumber(monthlySubscriptionTotal._sum.amount),
        transactionCount: recentTransactions.length,
        firstDepositAmount: firstDeposit ? toNumber(firstDeposit.amount) : null,
        firstDepositDate: toIsoString(firstDeposit?.createdAt),
        latestDepositAmount: latestDeposit ? toNumber(latestDeposit.amount) : null,
        latestDepositDate: toIsoString(latestDeposit?.createdAt),
      },
      totals: {
        totalBalance: serializedAccounts.reduce((sum, account) => sum + account.balance, 0),
        accountCount: serializedAccounts.length,
        shareCount: member.shareCount ?? 0,
        outstandingLoanBalance: member.loans.reduce((sum, loan) => sum + toNumber(loan.balance), 0),
        activeLoanCount: member.loans.length,
        childCount: Array.isArray(member.children) ? member.children.length : 0,
        spouseCount: Array.isArray(member.spouses) ? member.spouses.length : 0,
      },
      socialWelfare: {
        weddings: {
          status: member.weddingSupportStatus as "received" | "requested" | "not_received",
          totalDebt: toNumber(member.weddingSupportDebt),
        },
        condolences: {
          status: member.condolenceSupportStatus as "received" | "requested" | "not_received",
          totalDebt: toNumber(member.condolenceSupportDebt),
        },
        totalPledged: activePledges.reduce((sum, pledge) => sum + toNumber(pledge.amount), 0),
        activePledges: activePledges.length,
      },
    };
  }
}
