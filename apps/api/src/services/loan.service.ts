import { prisma, withTx } from "../config/db";
import { flags } from "../config/flags";
import { HTTPException } from "hono/http-exception";
import { LOAN_INTEREST_RATES } from "@iffe/shared";
import type { CreateLoanInput, LoanType, MemberLoanApplicationInput, PaginationInput } from "@iffe/shared";
import type { Prisma, PrismaClient } from "@prisma/client";
import { Money } from "@iffe/ledger";
import { logger } from "../utils/logger";
import { runWorkflow } from "../workflows/runtime";
import { loanDisbursementWorkflow } from "../workflows/loan-disbursement.workflow";
import { loanRepaymentWorkflow } from "../workflows/loan-repayment.workflow";

const ACCOUNT_TYPE_PRIORITY = ["savings", "current", "fixed_deposit"] as const;

/**
 * Client type accepted by read-only helpers below. Either the shared
 * HTTP prisma client or a transaction-scoped client works — both
 * expose the same read API for account/loan queries.
 */
type AnyClient = Prisma.TransactionClient | PrismaClient;

export class LoanService {
  async getAll(params: PaginationInput & { status?: string; memberId?: string }) {
    const { page = 1, limit = 20, search, sortBy = "createdAt", sortOrder = "desc", status, memberId } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (memberId) where.memberId = memberId;
    if (search)
      where.OR = [
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

  private calculateMonthlyPayment(amount: number, interestRate: number, term: number) {
    const monthlyRate = interestRate / 100 / 12;

    if (monthlyRate > 0) {
      return Math.round(
        (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1),
      );
    }

    return Math.round(amount / term);
  }

  private async ensureEligibleMember(memberId: string) {
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) throw new HTTPException(404, { message: "Member not found" });
    if (member.status !== "active")
      throw new HTTPException(400, { message: "Member must be active to apply for a loan" });
    return member;
  }

  private async createPendingLoan(data: CreateLoanInput) {
    const monthlyPayment = this.calculateMonthlyPayment(data.amount, data.interestRate, data.term);

    return prisma.loan.create({
      data: { ...data, balance: data.amount, monthlyPayment, status: "pending" },
      include: { member: true },
    });
  }

  async create(data: CreateLoanInput) {
    await this.ensureEligibleMember(data.memberId);
    return this.createPendingLoan(data);
  }

  async applyForMember(memberId: string, data: MemberLoanApplicationInput) {
    await this.ensureEligibleMember(memberId);

    const existingPendingLoan = await prisma.loan.findFirst({
      where: {
        memberId,
        status: "pending",
      },
    });
    if (existingPendingLoan) {
      throw new HTTPException(409, { message: "You already have a pending loan application under review" });
    }

    const type = data.type as LoanType;
    return this.createPendingLoan({
      memberId,
      type,
      amount: data.amount,
      interestRate: LOAN_INTEREST_RATES[type],
      term: data.term,
    });
  }

  private async getLoanForProcessing(tx: AnyClient, id: string) {
    const loan = await tx.loan.findUnique({
      where: { id },
      include: { member: true },
    });
    if (!loan) throw new HTTPException(404, { message: "Loan not found" });
    return loan;
  }

  private async resolveMemberAccount(tx: AnyClient, memberId: string, accountId?: string) {
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

    const selectedAccount = [...accounts].sort((left, right) => {
      const leftPriority = ACCOUNT_TYPE_PRIORITY.indexOf(left.type as (typeof ACCOUNT_TYPE_PRIORITY)[number]);
      const rightPriority = ACCOUNT_TYPE_PRIORITY.indexOf(right.type as (typeof ACCOUNT_TYPE_PRIORITY)[number]);
      const normalizedLeft = leftPriority === -1 ? ACCOUNT_TYPE_PRIORITY.length : leftPriority;
      const normalizedRight = rightPriority === -1 ? ACCOUNT_TYPE_PRIORITY.length : rightPriority;
      return normalizedLeft - normalizedRight;
    })[0];

    if (!selectedAccount) {
      throw new HTTPException(400, { message: "Member needs an active account before loan processing" });
    }

    return selectedAccount;
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
    // Pre-validation is identical in both paths and is cheaper to run
    // outside the main transaction/workflow so callers get a clean
    // 404/400/409 without touching the ledger.
    const loan = await this.getLoanForProcessing(prisma, id);
    if (loan.status !== "pending") {
      throw new HTTPException(400, { message: "Loan is not pending approval" });
    }

    // Guard against retrying a partially-complete disbursement. If a
    // transaction row already exists under our deterministic key, the
    // workflow ran once — treat the approval as a no-op and return the
    // current loan state instead of double-crediting the account.
    const existingDisbursementTxn = await prisma.transaction.findFirst({
      where: {
        OR: [
          { idempotencyKey: `loan-disbursement:${id}:txn` },
          {
            type: "loan_disbursement",
            reference: this.getDisbursementReference(id),
            status: { in: ["pending", "completed"] },
          },
        ],
      },
    });
    if (existingDisbursementTxn) {
      throw new HTTPException(400, { message: "Loan has already been disbursed" });
    }

    const targetAccount = await this.resolveMemberAccount(prisma, loan.memberId);

    if (flags.ledgerEnabled) {
      // Phase 10.1 ledger path — flip to `approved` so the workflow's
      // precondition check passes, then run the disbursement workflow
      // which transitions approved→active, posts a balanced journal
      // entry (Dr Loans Receivable / Cr Member Liability), and updates
      // the Account.balance projection + Transaction row atomically.
      logger.info(
        { event: "loan.approve.workflow", loanId: id, amount: loan.amount },
        "approving loan disbursement via ledger workflow",
      );

      const approved = await prisma.loan.updateMany({
        where: { id, status: "pending" },
        data: { status: "approved", approvedBy },
      });
      if (approved.count === 0) {
        throw new HTTPException(409, { message: "Loan is no longer pending approval" });
      }

      try {
        await runWorkflow(loanDisbursementWorkflow, {
          idempotencyKey: `loan-disbursement:${id}`,
          startedBy: approvedBy,
          input: {
            loanId: id,
            memberAccountId: targetAccount.id,
            processedBy: approvedBy,
            method: "internal",
          },
        });
      } catch (err) {
        // On workflow failure, leave the loan in `approved` state so an
        // operator can see it's stuck between "admin approved" and
        // "ledger posted", rather than silently reverting. The failure
        // shows up in logs + WorkflowRun.status='failed', and Phase 11
        // will add a retry endpoint. Rethrow so the route returns 500.
        logger.error(
          {
            event: "loan.approve.workflow.failed",
            loanId: id,
            err: err instanceof Error ? err.message : String(err),
          },
          "loan disbursement workflow failed — loan remains in 'approved' state pending operator review",
        );
        throw err;
      }

      // Set nextPaymentDate — the workflow doesn't touch it.
      const disbursedAt = new Date();
      const updatedLoan = await prisma.loan.update({
        where: { id },
        data: { nextPaymentDate: this.getNextPaymentDate(disbursedAt) },
        include: { member: true },
      });
      return updatedLoan;
    }

    // Legacy kill-switch path (LEDGER_ENABLED=false). Identical to the
    // pre-Phase-10.1 behaviour: Transaction + Account balance + loan
    // transition all inside one DB transaction.
    logger.warn(
      { event: "loan.approve.legacy", loanId: id },
      "approving loan disbursement via legacy direct-balance path (LEDGER_ENABLED=false)",
    );
    return withTx(async (tx) => {
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
    // Pre-validate reads outside the write path.
    const loan = await this.getLoanForProcessing(prisma, id);
    if (!["active", "overdue"].includes(loan.status)) {
      throw new HTTPException(400, { message: "Loan is not active" });
    }

    const outstandingBalance = Number(loan.balance);
    if (amount > outstandingBalance) {
      throw new HTTPException(400, { message: "Payment exceeds outstanding balance" });
    }

    const sourceAccount = await this.resolveMemberAccount(prisma, loan.memberId, accountId);
    if (Number(sourceAccount.balance) < amount) {
      throw new HTTPException(400, { message: "Selected account has insufficient balance for this repayment" });
    }

    if (flags.ledgerEnabled) {
      // Phase 10.1 ledger path — run the repayment workflow. It splits
      // the payment into interest and principal components, posts a
      // balanced journal entry for each, decrements the source account
      // projection, and updates the loan's balance + interestAccrued.
      //
      // Idempotency note: the workflow's `idempotencyKey` is unique
      // per-invocation (`loan-repayment:${loanId}:${timestamp}`), so
      // each repayment call produces its own ledger entry — matching
      // legacy behaviour where each call created a fresh Transaction
      // row. Client-side retry needs the client to reuse an
      // Idempotency-Key header (enforced by middleware/idempotency.ts
      // at the HTTP layer).
      const timestamp = Date.now();
      logger.info(
        { event: "loan.repayment.workflow", loanId: id, amount, timestamp },
        "recording loan repayment via ledger workflow",
      );

      await runWorkflow(loanRepaymentWorkflow, {
        idempotencyKey: `loan-repayment:${id}:${timestamp}`,
        startedBy: processedBy,
        input: {
          loanId: id,
          memberAccountId: sourceAccount.id,
          payment: Money.toString(Money.of(amount.toString())),
          processedBy,
        },
      });

      // The workflow already transitioned the loan to `paid` if the
      // payment zeroed both principal and accrued interest. Fetch the
      // updated balance to decide whether to clear `nextPaymentDate`.
      const postWorkflowLoan = await prisma.loan.findUnique({ where: { id } });
      const remainingPrincipal = Number(postWorkflowLoan?.balance ?? 0);
      const remainingInterest = Number(postWorkflowLoan?.interestAccrued ?? 0);
      const isPaidOff = remainingPrincipal === 0 && remainingInterest === 0;
      const nextPaymentDate = isPaidOff ? null : this.getNextPaymentDate(loan.nextPaymentDate ?? new Date());

      const updatedLoan = await prisma.loan.update({
        where: { id },
        data: { nextPaymentDate },
        include: { member: true },
      });
      return updatedLoan;
    }

    // Legacy kill-switch path.
    logger.warn(
      { event: "loan.repayment.legacy", loanId: id },
      "recording loan repayment via legacy direct-balance path (LEDGER_ENABLED=false)",
    );
    return withTx(async (tx) => {
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
    return {
      active: activeCount,
      outstanding: activeAmount._sum.balance || 0,
      overdue,
      totalDisbursed: totalDisbursed._sum.amount || 0,
    };
  }
}
