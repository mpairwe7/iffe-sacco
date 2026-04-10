/**
 * Journal entry invariant tests.
 * Run with: bun test
 */
import { describe, expect, test } from "bun:test";
import { assertBalanced, JournalEntry } from "../journal";
import { GL_ACCOUNTS } from "../gl-accounts";
import { Money } from "../money";

const common = {
  idempotencyKey: "test-entry-1",
  description: "unit test",
  createdBy: "test-user",
};

describe("JournalEntry", () => {
  test("balanced entry builds successfully", () => {
    const entry = JournalEntry.builder(common)
      .debit(GL_ACCOUNTS.CASH_ON_HAND.code, Money.of("100"))
      .credit(GL_ACCOUNTS.MEMBER_SAVINGS.code, Money.of("100"))
      .build();
    expect(entry.lines).toHaveLength(2);
    assertBalanced(entry);
  });

  test("unbalanced entry throws at build()", () => {
    const builder = JournalEntry.builder(common)
      .debit(GL_ACCOUNTS.CASH_ON_HAND.code, Money.of("100"))
      .credit(GL_ACCOUNTS.MEMBER_SAVINGS.code, Money.of("99"));
    expect(() => builder.build()).toThrow(/unbalanced/);
  });

  test("empty entry rejected", () => {
    const builder = JournalEntry.builder(common);
    expect(() => builder.build()).toThrow(/at least two lines/);
  });

  test("zero-amount entry rejected", () => {
    const builder = JournalEntry.builder(common)
      .debit(GL_ACCOUNTS.CASH_ON_HAND.code, Money.of("0"))
      .credit(GL_ACCOUNTS.MEMBER_SAVINGS.code, Money.of("0"));
    expect(() => builder.build()).toThrow();
  });

  test("multi-line balanced entry works", () => {
    const entry = JournalEntry.builder(common)
      .debit(GL_ACCOUNTS.CASH_ON_HAND.code, Money.of("50"))
      .debit(GL_ACCOUNTS.MOBILE_MONEY.code, Money.of("50"))
      .credit(GL_ACCOUNTS.MEMBER_SAVINGS.code, Money.of("100"))
      .build();
    expect(entry.lines).toHaveLength(3);
  });

  test("negative amounts rejected", () => {
    const builder = JournalEntry.builder(common);
    expect(() => builder.debit(GL_ACCOUNTS.CASH_ON_HAND.code, Money.of("-10"))).toThrow();
  });

  test("idempotencyKey is required", () => {
    expect(() => JournalEntry.builder({ description: "x", createdBy: "u", idempotencyKey: "" })).toThrow();
  });

  test("sub-cent amounts round at posting", () => {
    const entry = JournalEntry.builder(common)
      .debit(GL_ACCOUNTS.CASH_ON_HAND.code, Money.of("100.005"))
      .credit(GL_ACCOUNTS.MEMBER_SAVINGS.code, Money.of("100.005"))
      .build();
    // Both sides should round identically (to 100.00 or 100.01 via half-even)
    assertBalanced(entry);
  });
});
