/**
 * Interest service — Decimal-safe.
 *
 * Phase 1 rewrite: all math goes through Money helpers. The `preview`
 * endpoint still returns the same shape for backwards compatibility but
 * computes with Decimal precision internally.
 *
 * Posting is now delegated to the savings interest accrual workflow
 * (per-account), which ensures every interest credit is a balanced
 * journal entry tagged with an idempotency key.
 */
// @ts-nocheck
import { prisma } from "../config/db";
import { INTEREST_RATES } from "@iffe/shared";
import type { CalculateInterestInput } from "@iffe/shared";
import { Money } from "@iffe/ledger";
import { runWorkflow } from "../workflows/runtime";
import { accrueSavingsInterestWorkflow } from "../workflows/interest-accrual.workflow";

export class InterestService {
  async preview(input: CalculateInterestInput) {
    const accounts = await prisma.account.findMany({
      where: { type: input.accountType, status: "active" },
      include: { member: true },
    });

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const days = Math.max(0, Math.ceil((endDate.getTime() - startDate.getTime()) / MS_PER_DAY));

    const details = accounts.map((account: any) => {
      const fallbackRate = INTEREST_RATES[input.accountType as keyof typeof INTEREST_RATES] ?? 12;
      const rate = Money.fromDb(account.interestRate ?? fallbackRate);
      const balance = Money.fromDb(account.balance);

      // daily = balance * (rate/100) / 365
      // period = daily * days
      const dailyRate = Money.div(Money.div(rate, 100), 365);
      const interest = Money.toPostingAmount(Money.mul(Money.mul(balance, dailyRate), days));

      return {
        accountId: account.id,
        accountNo: account.accountNo,
        memberName: `${account.member.firstName} ${account.member.lastName}`,
        balance: Money.toString(balance),
        rate: Money.toString(rate),
        interest: Money.toString(interest),
      };
    });

    const totalInterest = details.reduce((acc, d) => Money.add(acc, Money.of(d.interest)), Money.zero());

    return {
      accountsProcessed: details.length,
      totalInterest: Money.toString(totalInterest),
      days,
      details,
    };
  }

  async calculateAndPost(input: CalculateInterestInput, processedBy: string) {
    const accounts = await prisma.account.findMany({
      where: { type: input.accountType, status: "active" },
      select: { id: true },
    });

    const asOf = input.postingDate ?? input.endDate;
    const results: Array<{ accountId: string; credited: string; journalEntryId: string | null }> = [];

    for (const acc of accounts) {
      const { output } = await runWorkflow(accrueSavingsInterestWorkflow, {
        idempotencyKey: `savings-interest-accrual:${acc.id}:${asOf}`,
        startedBy: processedBy,
        input: { accountId: acc.id, asOf, processedBy },
      });
      results.push({
        accountId: acc.id,
        credited: output.credited,
        journalEntryId: output.journalEntryId,
      });
    }

    const totalCredited = results.reduce((acc, r) => Money.add(acc, Money.of(r.credited)), Money.zero());

    return {
      accountsProcessed: results.length,
      totalCredited: Money.toString(totalCredited),
      results,
    };
  }
}
