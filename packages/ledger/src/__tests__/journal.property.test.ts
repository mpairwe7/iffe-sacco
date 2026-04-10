/**
 * Property-based tests for JournalEntry invariants.
 *
 * The headline invariant: sum(debits) == sum(credits) for every built
 * entry. If fast-check can find a balanced sequence of debit/credit
 * calls that produces an unbalanced entry, the ledger is broken.
 */
import { describe, test, expect } from "bun:test";
import fc from "fast-check";
import { JournalEntry, assertBalanced } from "../journal";
import { GL_ACCOUNTS } from "../gl-accounts";
import { Money } from "../money";

const amount = fc
  .tuple(fc.integer({ min: 1, max: 10_000_000 }), fc.integer({ min: 0, max: 9999 }))
  .map(([w, f]) => Money.of(`${w}.${String(f).padStart(4, "0")}`));

const accountCode = fc.constantFrom(
  GL_ACCOUNTS.CASH_ON_HAND.code,
  GL_ACCOUNTS.MOBILE_MONEY.code,
  GL_ACCOUNTS.MEMBER_SAVINGS.code,
  GL_ACCOUNTS.LOANS_RECEIVABLE.code,
  GL_ACCOUNTS.INTEREST_INCOME_LOANS.code,
);

const header = {
  description: "property test",
  createdBy: "property-test",
};

describe("JournalEntry properties", () => {
  test("balanced builder always produces balanced entry", () => {
    fc.assert(
      fc.property(fc.array(fc.tuple(accountCode, amount), { minLength: 1, maxLength: 10 }), (legs) => {
        const builder = JournalEntry.builder({
          ...header,
          idempotencyKey: `prop-${Math.random()}`,
        });
        // Left side: all the legs go on debit.
        for (const [acct, amt] of legs) builder.debit(acct, amt);
        // Right side: sum of all legs, one credit line against the balancing account.
        const total = legs.reduce((acc, [, amt]) => Money.add(acc, amt), Money.zero());
        builder.credit(GL_ACCOUNTS.SUSPENSE.code, total);

        const entry = builder.build();
        assertBalanced(entry);
        expect(entry.lines.length).toBe(legs.length + 1);
        return true;
      }),
    );
  });

  test("mismatched credit always throws at build()", () => {
    fc.assert(
      fc.property(
        fc.tuple(amount, fc.integer({ min: 1, max: 10 })).filter(([amt, delta]) => !Money.isZero(amt) && delta !== 0),
        ([amt, delta]) => {
          const builder = JournalEntry.builder({
            ...header,
            idempotencyKey: `prop-mismatch-${Math.random()}`,
          })
            .debit(GL_ACCOUNTS.CASH_ON_HAND.code, amt)
            .credit(GL_ACCOUNTS.MEMBER_SAVINGS.code, Money.add(amt, Money.of(delta)));
          try {
            builder.build();
            return false; // should have thrown
          } catch (err) {
            return (err as Error).message.includes("unbalanced");
          }
        },
      ),
    );
  });

  test("empty builder throws", () => {
    const builder = JournalEntry.builder({ ...header, idempotencyKey: "empty" });
    expect(() => builder.build()).toThrow();
  });
});
