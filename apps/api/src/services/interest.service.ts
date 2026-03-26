import { prisma } from "../config/db";
import { INTEREST_RATES } from "@iffe/shared";
import type { CalculateInterestInput } from "@iffe/shared";

export class InterestService {
  async preview(input: CalculateInterestInput) {
    const accounts = await prisma.account.findMany({
      where: { type: input.accountType, status: "active" },
      include: { member: true },
    });

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const details = accounts.map((account) => {
      const rate = Number(account.interestRate) || INTEREST_RATES[input.accountType as keyof typeof INTEREST_RATES] || 12;
      const balance = Number(account.balance);
      const interest = (balance * rate / 100) * (days / 365);
      return {
        accountId: account.id,
        accountNo: account.accountNo,
        memberName: `${account.member.firstName} ${account.member.lastName}`,
        balance,
        rate,
        interest: Math.round(interest * 100) / 100,
      };
    });

    const totalInterest = details.reduce((sum, d) => sum + d.interest, 0);

    return { accountsProcessed: details.length, totalInterest, days, details };
  }

  async calculateAndPost(input: CalculateInterestInput, processedBy: string) {
    const preview = await this.preview(input);
    const postingDate = input.postingDate ? new Date(input.postingDate) : new Date();

    await prisma.$transaction(async (tx) => {
      for (const detail of preview.details) {
        if (detail.interest <= 0) continue;

        await tx.transaction.create({
          data: {
            accountId: detail.accountId,
            type: "interest_credit",
            amount: detail.interest,
            method: "internal",
            description: `Interest credit for ${input.startDate} to ${input.endDate}`,
            status: "completed",
            processedBy,
          },
        });

        await tx.account.update({
          where: { id: detail.accountId },
          data: { balance: { increment: detail.interest }, lastActivity: postingDate },
        });
      }
    });

    return preview;
  }
}
