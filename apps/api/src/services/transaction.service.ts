import { prisma, withTx } from "../config/db";
import { flags } from "../config/flags";
import { HTTPException } from "hono/http-exception";
import type { PaginationInput } from "@iffe/shared";
import { GL_ACCOUNTS, JournalEntry, memberLiabilityAccountFor, Money } from "@iffe/ledger";
import { postJournal } from "./ledger.service";
import { logger } from "../utils/logger";
import { mapMethodToLedgerSource, type LedgerFundsSource } from "../utils/payment-method";

/** Map cash-side funds source to its GL account. */
function cashAccountFor(source: LedgerFundsSource) {
  switch (source) {
    case "cash":
      return GL_ACCOUNTS.CASH_ON_HAND;
    case "mobile_money":
      return GL_ACCOUNTS.MOBILE_MONEY;
    case "bank_transfer":
      return GL_ACCOUNTS.CASH_AT_BANK;
  }
}

// Transaction types that Phase 10.2 posts to the ledger via direct
// postJournal (not workflows — the Transaction row already exists
// from the `create` step, and the workflow would create a duplicate).
const LEDGER_SUPPORTED_APPROVAL_TYPES = new Set(["deposit", "withdrawal"]);

export class TransactionService {
  async getAll(
    params: PaginationInput & { type?: string; status?: string; accountId?: string; accountIds?: string[] },
  ) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      type,
      status,
      accountId,
      accountIds,
    } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (accountIds) where.accountId = { in: accountIds };
    else if (accountId) where.accountId = accountId;
    if (search)
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
      ];
    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { account: { include: { member: true } } },
      }),
      prisma.transaction.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(id: string) {
    const txn = await prisma.transaction.findUnique({
      where: { id },
      include: { account: { include: { member: true } } },
    });
    if (!txn) throw new HTTPException(404, { message: "Transaction not found" });
    return txn;
  }

  async create(data: {
    accountId: string;
    type: string;
    amount: number;
    method: string;
    description?: string;
    reference?: string;
    processedBy?: string;
  }) {
    // Validate account exists and is active
    const account = await prisma.account.findUnique({ where: { id: data.accountId } });
    if (!account) throw new HTTPException(404, { message: "Account not found" });
    if (account.status !== "active") throw new HTTPException(400, { message: "Account is not active" });

    // For withdrawals, check sufficient balance
    if (["withdrawal", "transfer", "fee"].includes(data.type)) {
      if (Number(account.balance) < data.amount) {
        throw new HTTPException(400, { message: "Insufficient balance" });
      }
    }

    return withTx(async (tx: any) => {
      const txn = await tx.transaction.create({ data: { ...data, status: "pending" } });
      return txn;
    });
  }

  async approve(id: string, processedBy: string) {
    const txn = await this.getById(id);
    if (txn.status !== "pending") throw new HTTPException(400, { message: "Transaction is not pending" });

    // Phase 10.2: if the transaction is a deposit or withdrawal and
    // the ledger is enabled, post a balanced journal entry and link
    // it to the existing Transaction row. Direct postJournal (not a
    // workflow call) because the Transaction row already exists from
    // the earlier `create` step — running depositWorkflow here would
    // create a duplicate row.
    //
    // Types outside LEDGER_SUPPORTED_APPROVAL_TYPES fall through to
    // the legacy direct-balance path. Loan disbursement / repayment
    // have their own dedicated flows (see loan.service.ts); interest
    // credit and fees are rare admin paths kept on legacy for now.
    if (flags.ledgerEnabled && LEDGER_SUPPORTED_APPROVAL_TYPES.has(txn.type)) {
      const account = await prisma.account.findUnique({ where: { id: txn.accountId } });
      if (!account) throw new HTTPException(404, { message: "Account not found" });
      if (account.status !== "active") {
        throw new HTTPException(400, { message: "Account is not active" });
      }

      // Re-check sufficient balance for withdrawals inside the write
      // path — the balance may have moved since the original create.
      if (txn.type === "withdrawal" && Number(account.balance) < Number(txn.amount)) {
        throw new HTTPException(400, { message: "Insufficient balance" });
      }

      const amount = Money.fromDb(txn.amount);
      const memberLiability = memberLiabilityAccountFor(account.type);
      const cashSide = cashAccountFor(mapMethodToLedgerSource(txn.method));

      const builder = JournalEntry.builder({
        description: txn.description || `Manual ${txn.type} approval ${id}`,
        idempotencyKey: `transaction-approval:${id}`,
        createdBy: processedBy,
        metadata: {
          transactionId: id,
          transactionType: txn.type,
          manualEntry: true,
          accountNo: account.accountNo,
          memberId: account.memberId,
        },
      });

      // Deposit: Dr cash / Cr member-liability (SACCO owes more).
      // Withdrawal: Dr member-liability / Cr cash (SACCO owes less).
      if (txn.type === "deposit") {
        builder.debit(cashSide.code, amount, { memberAccountId: account.id });
        builder.credit(memberLiability.code, amount, { memberAccountId: account.id });
      } else {
        builder.debit(memberLiability.code, amount, { memberAccountId: account.id });
        builder.credit(cashSide.code, amount, { memberAccountId: account.id });
      }

      const entry = builder.build();

      logger.info(
        {
          event: "transaction.approve.workflow",
          transactionId: id,
          type: txn.type,
          amount: txn.amount,
        },
        "approving manual transaction via ledger journal post",
      );

      return withTx(async (tx: any) => {
        const { entryId } = await postJournal(entry, tx);

        const delta = txn.type === "deposit" ? Number(txn.amount) : -Number(txn.amount);
        await tx.account.update({
          where: { id: txn.accountId },
          data: { balance: { increment: delta }, lastActivity: new Date() },
        });

        const updated = await tx.transaction.update({
          where: { id },
          data: {
            status: "completed",
            processedBy,
            journalEntryId: entryId,
            idempotencyKey: `transaction-approval:${id}`,
          },
        });
        return updated;
      });
    }

    // Legacy kill-switch path — also used for transaction types the
    // ledger doesn't support as manual entries (transfer, fee,
    // interest_credit, loan_disbursement, loan_repayment).
    logger.warn(
      {
        event: "transaction.approve.legacy",
        transactionId: id,
        type: txn.type,
        reason: !flags.ledgerEnabled ? "ledger_disabled" : "unsupported_type",
      },
      "approving manual transaction via legacy direct-balance path",
    );
    return withTx(async (tx: any) => {
      const updated = await tx.transaction.update({ where: { id }, data: { status: "completed", processedBy } });

      // Update account balance
      const isCredit = ["deposit", "loan_disbursement", "interest_credit"].includes(txn.type);
      const delta = isCredit ? Number(txn.amount) : -Number(txn.amount);
      await tx.account.update({
        where: { id: txn.accountId },
        data: { balance: { increment: delta }, lastActivity: new Date() },
      });

      return updated;
    });
  }

  async reject(id: string, processedBy: string) {
    const txn = await this.getById(id);
    if (txn.status !== "pending") throw new HTTPException(400, { message: "Transaction is not pending" });
    return prisma.transaction.update({ where: { id }, data: { status: "rejected", processedBy } });
  }

  async reverse(id: string, processedBy: string) {
    const txn = await this.getById(id);
    if (txn.status !== "completed")
      throw new HTTPException(400, { message: "Only completed transactions can be reversed" });

    return withTx(async (tx: any) => {
      const updated = await tx.transaction.update({ where: { id }, data: { status: "reversed", processedBy } });

      // Reverse the balance change
      const isCredit = ["deposit", "loan_disbursement", "interest_credit"].includes(txn.type);
      const delta = isCredit ? -Number(txn.amount) : Number(txn.amount);
      await tx.account.update({
        where: { id: txn.accountId },
        data: { balance: { increment: delta }, lastActivity: new Date() },
      });

      return updated;
    });
  }

  async getStats() {
    const [totalDeposits, totalWithdrawals, pending, total] = await Promise.all([
      prisma.transaction.aggregate({ where: { type: "deposit", status: "completed" }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { type: "withdrawal", status: "completed" }, _sum: { amount: true } }),
      prisma.transaction.count({ where: { status: "pending" } }),
      prisma.transaction.count(),
    ]);
    return {
      total,
      totalDeposits: totalDeposits._sum.amount || 0,
      totalWithdrawals: totalWithdrawals._sum.amount || 0,
      pending,
    };
  }
}
