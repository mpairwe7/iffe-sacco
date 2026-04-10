/**
 * Property-based tests for Money arithmetic.
 *
 * These exercise invariants that MUST hold for any input — the kind of
 * thing example-based tests rarely catch. Any regression in Money
 * arithmetic here is a P0 for the ledger.
 */
import { describe, test } from "bun:test";
import fc from "fast-check";
import { Money } from "../money";

// Generator for integer-valued money (no float footguns at the boundary).
const moneyInt = fc.integer({ min: 0, max: 1_000_000_000 }).map((n) => Money.of(n));

// Generator for decimal-string money up to 4 dp.
const moneyString = fc
  .tuple(fc.integer({ min: 0, max: 1_000_000_000 }), fc.integer({ min: 0, max: 9999 }))
  .map(([whole, frac]) => Money.of(`${whole}.${String(frac).padStart(4, "0")}`));

const anyMoney = fc.oneof(moneyInt, moneyString);

describe("Money properties", () => {
  test("addition commutes", () => {
    fc.assert(
      fc.property(anyMoney, anyMoney, (a, b) => {
        return Money.eq(Money.add(a, b), Money.add(b, a));
      }),
    );
  });

  test("addition is associative", () => {
    fc.assert(
      fc.property(anyMoney, anyMoney, anyMoney, (a, b, c) => {
        const left = Money.add(Money.add(a, b), c);
        const right = Money.add(a, Money.add(b, c));
        return Money.eq(left, right);
      }),
    );
  });

  test("zero is additive identity", () => {
    fc.assert(fc.property(anyMoney, (a) => Money.eq(Money.add(a, Money.zero()), a)));
  });

  test("subtracting self yields zero", () => {
    fc.assert(fc.property(anyMoney, (a) => Money.isZero(Money.sub(a, a))));
  });

  test("add then sub is identity", () => {
    fc.assert(
      fc.property(anyMoney, anyMoney, (a, b) => {
        return Money.eq(Money.sub(Money.add(a, b), b), a);
      }),
    );
  });

  test("mul by 1 is identity", () => {
    fc.assert(fc.property(anyMoney, (a) => Money.eq(Money.mul(a, 1), a)));
  });

  test("mul by 0 is zero", () => {
    fc.assert(fc.property(anyMoney, (a) => Money.isZero(Money.mul(a, 0))));
  });

  test("toPostingAmount is idempotent", () => {
    fc.assert(
      fc.property(anyMoney, (a) => {
        const once = Money.toPostingAmount(a);
        const twice = Money.toPostingAmount(once);
        return Money.eq(once, twice);
      }),
    );
  });

  test("sum equals repeated add", () => {
    fc.assert(
      fc.property(fc.array(anyMoney, { minLength: 0, maxLength: 50 }), (values) => {
        const viaSum = Money.sum(values);
        const viaFold = values.reduce((acc, v) => Money.add(acc, v), Money.zero());
        return Money.eq(viaSum, viaFold);
      }),
    );
  });

  test("comparisons are total and consistent", () => {
    fc.assert(
      fc.property(anyMoney, anyMoney, (a, b) => {
        const gt = Money.gt(a, b);
        const lt = Money.lt(a, b);
        const eq = Money.eq(a, b);
        // Exactly one of gt, lt, eq is true
        return Number(gt) + Number(lt) + Number(eq) === 1;
      }),
    );
  });
});
