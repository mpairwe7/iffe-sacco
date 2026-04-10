import { WelfareRepository } from "../repositories/welfare.repository";
import { PledgeRepository } from "../repositories/pledge.repository";
import { HTTPException } from "hono/http-exception";
import type { CreateWelfareInput, PledgeInput, PaginationInput } from "@iffe/shared";
import { Money } from "@iffe/ledger";
import { prisma, withTx } from "../config/db";
import { flags } from "../config/flags";
import { logger } from "../utils/logger";
import { mapMethodToLedgerSource, type LedgerFundsSource } from "../utils/payment-method";
import { runWorkflow } from "../workflows/runtime";
import { pledgePaymentWorkflow } from "../workflows/pledge-payment.workflow";

const welfareRepo = new WelfareRepository();
const pledgeRepo = new PledgeRepository();

export class WelfareService {
  async getAll(params: PaginationInput & { status?: string }) {
    return welfareRepo.findAll(params);
  }

  async getById(id: string) {
    const program = await welfareRepo.findById(id);
    if (!program) throw new HTTPException(404, { message: "Welfare program not found" });
    return program;
  }

  async create(input: CreateWelfareInput) {
    return welfareRepo.create(input);
  }

  async update(id: string, data: Record<string, unknown>) {
    await this.getById(id);
    return welfareRepo.update(id, data);
  }

  async updateStatus(id: string, status: string) {
    await this.getById(id);
    return welfareRepo.updateStatus(id, status);
  }

  async createPledge(input: PledgeInput & { memberId: string }) {
    const program = await this.getById(input.programId);
    if (program.status !== "active") throw new HTTPException(400, { message: "Program is not active" });
    return pledgeRepo.create({ programId: input.programId, memberId: input.memberId, amount: input.amount });
  }

  async getPledges(programId: string, params: PaginationInput) {
    return pledgeRepo.findByProgram(programId, params);
  }

  async getMemberPledges(memberId: string, params: PaginationInput) {
    return pledgeRepo.findByMember(memberId, params);
  }

  async getStats() {
    return welfareRepo.getStats();
  }

  /**
   * Record a payment against a pledge. Transitions the pledge towards
   * `paid` (or `partially_paid`), updates the welfare program's
   * `raisedAmount`, and — when the ledger is enabled — posts a
   * balanced journal entry (Dr cash / Cr pledge income).
   *
   * When LEDGER_ENABLED=false, falls through to a legacy direct-write
   * path that keeps the existing Pledge.paidAmount + program
   * raisedAmount semantics but without touching the journal tables.
   */
  async recordPledgePayment(pledgeId: string, amount: number, method: string, processedBy: string) {
    // Pre-validate (cheap reads, outside any transaction)
    const pledge = await prisma.pledge.findUnique({
      where: { id: pledgeId },
      include: { program: true },
    });
    if (!pledge) {
      throw new HTTPException(404, { message: "Pledge not found" });
    }
    if (pledge.status === "cancelled") {
      throw new HTTPException(400, { message: "Cannot record payment against a cancelled pledge" });
    }

    const pledged = Money.fromDb(pledge.amount);
    const alreadyPaid = Money.fromDb(pledge.paidAmount);
    const outstanding = Money.sub(pledged, alreadyPaid);
    const paymentMoney = Money.of(amount.toString());

    if (Money.isZero(paymentMoney) || Money.isNegative(paymentMoney)) {
      throw new HTTPException(400, { message: "Pledge payment must be positive" });
    }
    if (Money.gt(paymentMoney, outstanding)) {
      throw new HTTPException(400, {
        message: `Payment exceeds outstanding pledge balance (${Money.toString(outstanding)} UGX remaining)`,
      });
    }

    const ledgerSource: LedgerFundsSource = mapMethodToLedgerSource(method);

    if (flags.ledgerEnabled) {
      // Phase 10.2 ledger path — run pledgePaymentWorkflow which:
      //   1. Validates the pledge + amount (again, inside the tx)
      //   2. Posts Dr cash/mobile_money/bank / Cr pledge income
      //   3. Increments pledge.paidAmount
      //   4. Marks pledge paid | partially_paid
      //   5. Increments welfareProgram.raisedAmount
      logger.info(
        {
          event: "pledge.payment.workflow",
          pledgeId,
          amount,
          method: ledgerSource,
        },
        "recording pledge payment via ledger workflow",
      );

      const timestamp = Date.now();
      await runWorkflow(pledgePaymentWorkflow, {
        idempotencyKey: `pledge-payment:${pledgeId}:${timestamp}`,
        startedBy: processedBy,
        input: {
          pledgeId,
          amount: Money.toString(paymentMoney),
          method: ledgerSource,
          processedBy,
        },
      });

      // Return the refreshed pledge so the caller can see the updated
      // paidAmount + status.
      const refreshed = await prisma.pledge.findUnique({
        where: { id: pledgeId },
        include: { program: true, member: true },
      });
      if (!refreshed) {
        throw new HTTPException(404, { message: "Pledge disappeared mid-payment" });
      }
      return refreshed;
    }

    // Legacy kill-switch path (LEDGER_ENABLED=false).
    logger.warn(
      { event: "pledge.payment.legacy", pledgeId },
      "recording pledge payment via legacy direct-write path (LEDGER_ENABLED=false)",
    );
    return withTx(async (tx: any) => {
      const newPaid = Money.add(alreadyPaid, paymentMoney);
      const fullyPaid = Money.gte(newPaid, pledged);

      await tx.pledge.update({
        where: { id: pledgeId },
        data: {
          paidAmount: Money.toString(newPaid),
          status: fullyPaid ? "paid" : "partially_paid",
          paidAt: fullyPaid ? new Date() : undefined,
        },
      });

      await tx.welfareProgram.update({
        where: { id: pledge.programId },
        data: {
          raisedAmount: { increment: Money.toString(paymentMoney) as any },
        },
      });

      const refreshed = await tx.pledge.findUnique({
        where: { id: pledgeId },
        include: { program: true, member: true },
      });
      return refreshed;
    });
  }
}
