/**
 * Unit test for interest preview arithmetic.
 *
 * This test does NOT hit Prisma — it mocks the client to isolate the
 * Decimal math. An end-to-end integration test exercising the real DB
 * lives in apps/api/src/workflows/__tests__/interest-accrual.test.ts.
 */
// @ts-nocheck
import { describe, expect, test, mock } from "bun:test";
import { Money } from "@iffe/ledger";

// Mock the prisma module before importing the service so the service
// picks up our stub client.
mock.module("../config/db", () => ({
  prisma: {
    account: {
      findMany: async () => [
        {
          id: "a1",
          accountNo: "S-001",
          balance: "1000000.00",
          interestRate: "12.00",
          type: "savings",
          status: "active",
          member: { firstName: "Alice", lastName: "Nakato" },
        },
        {
          id: "a2",
          accountNo: "S-002",
          balance: "500000.00",
          interestRate: "10.50",
          type: "savings",
          status: "active",
          member: { firstName: "Bob", lastName: "Mugisha" },
        },
      ],
      update: async () => ({}),
    },
    $transaction: async (fn: any) => fn({}),
    transaction: { create: async () => ({}) },
  },
}));

const { InterestService } = await import("../interest.service");

describe("InterestService.preview", () => {
  test("uses Decimal math (no float rounding) for a 30-day period", async () => {
    const svc = new InterestService();
    const result = await svc.preview({
      accountType: "savings" as const,
      startDate: "2026-04-01",
      endDate: "2026-05-01",
    });

    expect(result.accountsProcessed).toBe(2);
    expect(result.days).toBe(30);

    // Alice: 1_000_000 * 0.12 * 30/365 = 9863.0137 → posted 9863.01
    const alice = result.details.find((d) => d.accountId === "a1")!;
    expect(alice.interest).toBe("9863.01");

    // Bob: 500_000 * 0.105 * 30/365 = 4315.0685 → posted 4315.07
    const bob = result.details.find((d) => d.accountId === "a2")!;
    expect(bob.interest).toBe("4315.07");

    const total = Money.add(Money.of(alice.interest), Money.of(bob.interest));
    expect(result.totalInterest).toBe(Money.toString(total));
  });
});
