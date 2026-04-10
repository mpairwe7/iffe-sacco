/**
 * Money type — a branded Decimal with banker's rounding as the default.
 *
 * Rules:
 *   - Money never leaves this module as a JavaScript `number`.
 *   - All arithmetic goes through the Money helpers so rounding policy is
 *     consistent across deposits, interest, loan amortization, and reports.
 *   - Serialization is always via `.toString()` (never `.toNumber()`).
 *
 * Precision:
 *   - 4 decimal places of working precision so daily interest accrual doesn't
 *     lose fractional shillings before rollup.
 *   - 2 decimal places for display/posting amounts (use `toPostingAmount`).
 */
import Decimal from "decimal.js-light";

// decimal.js-light doesn't export modes with the same names as the full lib,
// so we set rounding per-operation where needed.
Decimal.set({ precision: 28 });

export type Money = Decimal & { readonly __money: unique symbol };

const ZERO = new Decimal(0) as Money;

function wrap(value: Decimal.Value): Money {
  return new Decimal(value) as Money;
}

export const Money = {
  zero(): Money {
    return ZERO;
  },

  of(value: Decimal.Value): Money {
    if (value === null || value === undefined) {
      throw new TypeError("Money.of received null/undefined");
    }
    // Reject raw JS floats in non-integer form to catch precision loss early.
    if (typeof value === "number" && !Number.isInteger(value)) {
      throw new TypeError(
        `Money.of refuses non-integer JS number (${value}); pass a string instead to avoid float precision loss`,
      );
    }
    const d = new Decimal(value);
    if (d.isNaN()) throw new TypeError(`Money.of received NaN (${String(value)})`);
    return d as Money;
  },

  /** Parse from persisted DB/JSON — accepts strings or Prisma.Decimal-like objects. */
  fromDb(value: unknown): Money {
    if (value === null || value === undefined) return ZERO;
    if (typeof value === "string" || typeof value === "number") return Money.of(value);
    if (typeof value === "object" && value !== null && "toString" in value) {
      return Money.of((value as { toString: () => string }).toString());
    }
    throw new TypeError(`Money.fromDb cannot interpret ${typeof value}`);
  },

  add(a: Money, b: Money): Money {
    return wrap(a.plus(b));
  },

  sub(a: Money, b: Money): Money {
    return wrap(a.minus(b));
  },

  mul(a: Money, factor: Decimal.Value): Money {
    return wrap(a.times(factor));
  },

  div(a: Money, divisor: Decimal.Value): Money {
    return wrap(a.dividedBy(divisor));
  },

  neg(a: Money): Money {
    return wrap(a.negated());
  },

  /** Round to 2dp using banker's rounding (ROUND_HALF_EVEN). */
  toPostingAmount(a: Money): Money {
    return wrap(a.toDecimalPlaces(2, 4 /* ROUND_HALF_EVEN in decimal.js-light */));
  },

  /** Round to configurable working precision (default 4dp) for intermediate calc. */
  toWorkingPrecision(a: Money, dp = 4): Money {
    return wrap(a.toDecimalPlaces(dp, 4));
  },

  eq(a: Money, b: Money): boolean {
    return a.equals(b);
  },

  gt(a: Money, b: Money): boolean {
    return a.greaterThan(b);
  },

  gte(a: Money, b: Money): boolean {
    return a.greaterThanOrEqualTo(b);
  },

  lt(a: Money, b: Money): boolean {
    return a.lessThan(b);
  },

  lte(a: Money, b: Money): boolean {
    return a.lessThanOrEqualTo(b);
  },

  isZero(a: Money): boolean {
    return a.isZero();
  },

  isNegative(a: Money): boolean {
    return a.isNegative();
  },

  /** Sum an arbitrary list at full precision. */
  sum(values: Money[]): Money {
    let acc: Decimal = new Decimal(0);
    for (const v of values) acc = acc.plus(v);
    return wrap(acc);
  },

  /** String for wire/DB. Never use toNumber on money. */
  toString(a: Money): string {
    return a.toString();
  },
};

/** Type-guard convenience. */
export function isMoney(value: unknown): value is Money {
  return value instanceof Decimal;
}
