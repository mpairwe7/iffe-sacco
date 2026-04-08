import { prisma } from "../config/db";
import { HTTPException } from "hono/http-exception";
import type { PaginationInput } from "@iffe/shared";
import type { Prisma } from "@prisma/client";

const ACCOUNT_TYPE_PRIORITY = ["savings", "current", "fixed_deposit"] as const;

export class LoanService {
  async getAll(params: PaginationInput & { status?: string; memberId?: string }) {
    const { page = 1, limit = 20, search, sortBy = "createdAt", sortOrder = "desc", status, memberId } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (memberId) where.memberId = memberId;
    if (search) where.OR = [
      { type: { contains: search, mode: "insensitive" } },
      { member: { firstName: { contains: search, mode: "insensitive" } } },
    ];
    const [data, total] = await Promise.all([
      prisma.loan.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder }, include: { member: true } }),
      prisma.loan.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(id: string) {
    const loan = await prisma.loan.findUnique({ where: { id }, include: { member: true } });
    if (!loan) throw new HTTPException(404, { message: "Loan not found" });
    return loan;
  }

  async create(data: { memberId: string; type: string; amount: number; interestRate: number; term: number }) {
    const member = await prisma.member.findUnique({ where: { id: data.memberId } });
    if (!member) throw new HTTPException(404, { message: "Member not found" });
    if (member.status !== "active") throw new HTTPException(400, { message: "Member must be active to apply for a loan" });

    const monthlyRate = data.interestRate / 100 / 12;
    const monthlyPayment = monthlyRate > 0
      ? (data.amount * monthlyRate * Math.pow(1 + monthlyRate, data.term)) / (Math.pow(1 + monthlyRate, data.term) - 1)
      : data.amount / data.term;

    return prisma.loan.create({
      data: { ...data, balance: data.amount, monthlyPayment: Math.round(monthlyPayment), status: "pending" },
      include: { member: true },
    });
  }

  private async getLoanForProcessing(tx: Prisma.TransactionClient, id: string) {
    const loan = await tx.loan.findUnique({
      where: { id },
      include: { member: true },
    });
    if (!loan) throw new HTTPException(404, { message: "Loan not found" });
    return loan;
  }

  private async resolveMemberAccount(tx: Prisma.TransactionClient, memberId: string, accountId?: string) {
    if (accountId) {
      const account = await tx.account.findUnique({ where: { id: accountId } });
      if (!account) throw new HTTPException(404, { message: "Account not found" });
      if (account.memberId !== memberId) {
        throw new HTTPException(403, { message: "Account does not belong to the loan member" });
      }
      if (account.status !== "active") {
        throw new HTTPException(400, { message: "Account must be active for loan processing" });
      }
      return account;
    }

    const accounts = await tx.account.findMany({
      where: { memberId, status: "active" },
      orderBy: { createdAt: "asc" },
    });

    if (accounts.length === 0) {
      throw new HTTPException(400, { message: "Member needs an active account before loan processing" });
    }

    return [...accounts].sort((left, right) => {
      const leftPriority = ACCOUNT_TYPE_PRIORITY.indexOf(left.type as (typeof ACCOUNT_TYPE_PRIORITY)[number]);
      const rightPriority = ACCOUNT_TYPE_PRIORITY.indexOf(right.type as (typeof ACCOUNT_TYPE_PRIORITY)[number]);
      const normalizedLeft = leftPriority === -1 ? ACCOUNT_TYPE_PRIORITY.length : leftPriority;
      const normalizedRight = rightPriority === -1 ? ACCOUNT_TYPE_PRIORITY.length : rightPriority;
      return normalizedLeft - normalizedRight;
    })[0];
  }

  private getNextPaymentDate(baseDate = new Date()) {
    const nextPayment = new Date(baseDate);
    nextPayment.setMonth(nextPayment.getMonth() + 1);
    return nextPayment;
  }

  private formatLoanType(type: string) {
    return type
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  private getDisbursementReference(loanId: string) {
    return `loan-disbursement:${loanId}`;
  }

  private getRepaymentReference(loanId: string) {
    return `loan-repayment:${loanId}:${Date.now()}`;
  }

  async approve(id: string, approvedBy: string) {
    return prisma.$transaction(async (tx) => {
      const loan = await this.getLoanForProcessing(tx, id);
      if (loan.status !== "pending") throw new HTTPException(400, { message: "Loan is not pending approval" });

      const existingDisbursement = await tx.transaction.findFirst({
        where: {
          type: "loan_disbursement",
          reference: this.getDisbursementReference(id),
          status: { in: ["pending", "completed"] },
        },
      });
      if (existingDisbursement) {
        throw new HTTPException(400, { message: "Loan has already been disbursed" });
      }

      const targetAccount = await this.resolveMemberAccount(tx, loan.memberId);
      const disbursedAt = new Date();
      const nextPaymentDate = this.getNextPaymentDate(disbursedAt);

      const approved = await tx.loan.updateMany({
        where: { id, status: "pending" },
        data: {
          status: "active",
          approvedBy,
          disbursedAt,
          nextPaymentDate,
        },
      });

      if (approved.count === 0) {
        throw new HTTPException(409, { message: "Loan is no longer pending approval" });
      }

      await tx.transaction.create({
        data: {
          accountId: targetAccount.id,
          type: "loan_disbursement",
          amount: loan.amount,
          method: "internal",
          description: `${this.formatLoanType(loan.type)} loan disbursement`,
          reference: this.getDisbursementReference(id),
          status: "completed",
          processedBy: approvedBy,
        },
      });

      await tx.account.update({
        where: { id: targetAccount.id },
        data: {
          balance: { increment: loan.amount },
          lastActivity: disbursedAt,
        },
      });

      const updatedLoan = await tx.loan.findUnique({
        where: { id },
        include: { member: true },
      });
      if (!updatedLoan) throw new HTTPException(404, { message: "Loan not found" });
      return updatedLoan;
    });
  }

  async reject(id: string) {
    const loan = await this.getById(id);
    if (loan.status !== "pending") throw new HTTPException(400, { message: "Loan is not pending" });
    return prisma.loan.update({ where: { id }, data: { status: "rejected" }, include: { member: true } });
  }

  async recordRepayment(id: string, amount: number, processedBy: string, accountId?: string) {
    return prisma.$transaction(async (tx) => {
      const loan = await this.getLoanForProcessing(tx, id);
      if (!["active", "overdue"].includes(loan.status)) throw new HTTPException(400, { message: "Loan is not active" });

      const outstandingBalance = Number(loan.balance);
      if (amount > outstandingBalance) throw new HTTPException(400, { message: "Payment exceeds outstanding balance" });

      const sourceAccount = await this.resolveMemberAccount(tx, loan.memberId, accountId);
      if (Number(sourceAccount.balance) < amount) {
        throw new HTTPException(400, { message: "Selected account has insufficient balance for this repayment" });
      }

      const processedAt = new Date();
      const newBalance = Math.max(0, outstandingBalance - amount);
      const isPaidOff = newBalance === 0;
      const nextPaymentDate = isPaidOff ? null : this.getNextPaymentDate(loan.nextPaymentDate ?? processedAt);

      await tx.transaction.create({
        data: {
          accountId: sourceAccount.id,
          type: "loan_repayment",
          amount,
          method: "internal",
          description: `${this.formatLoanType(loan.type)} loan repayment`,
          reference: this.getRepaymentReference(id),
          status: "completed",
          processedBy,
        },
      });

      await tx.account.update({
        where: { id: sourceAccount.id },
        data: {
          balance: { decrement: amount },
          lastActivity: processedAt,
        },
      });

      const updatedLoan = await tx.loan.update({
        where: { id },
        data: {
          balance: newBalance,
          status: isPaidOff ? "paid" : "active",
          nextPaymentDate,
        },
        include: { member: true },
      });

      return updatedLoan;
    });
  }

  async getStats() {
    const [activeCount, activeAmount, overdue, totalDisbursed] = await Promise.all([
      prisma.loan.count({ where: { status: "active" } }),
      prisma.loan.aggregate({ where: { status: "active" }, _sum: { balance: true } }),
      prisma.loan.count({ where: { status: "overdue" } }),
      prisma.loan.aggregate({ where: { status: { in: ["active", "paid"] } }, _sum: { amount: true } }),
    ]);
    return { active: activeCount, outstanding: activeAmount._sum.balance || 0, overdue, totalDisbursed: totalDisbursed._sum.amount || 0 };
  }
}
