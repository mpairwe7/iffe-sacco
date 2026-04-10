/**
 * Money arithmetic — invariants and edge cases.
 * Run with: bun test
 */
import { describe, expect, test } from "bun:test";
import { Money } from "../money";

describe("Money", () => {
  test("rejects non-integer JS numbers at the boundary", () => {
    expect(() => Money.of(0.1 + 0.2)).toThrow();
  });

  test("accepts decimal strings without precision loss", () => {
    const a = Money.of("0.1");
    const b = Money.of("0.2");
    expect(Money.toString(Money.add(a, b))).toBe("0.3");
  });

  test("addition is associative", () => {
    const a = Money.of("100.55");
    const b = Money.of("200.45");
    const c = Money.of("300.00");
    const left = Money.add(Money.add(a, b), c);
    const right = Money.add(a, Money.add(b, c));
    expect(Money.eq(left, right)).toBe(true);
  });

  test("subtraction from itself is zero", () => {
    const a = Money.of("12345.6789");
    expect(Money.isZero(Money.sub(a, a))).toBe(true);
  });

  test("posting amount uses banker's rounding (half-even)", () => {
    // 2.125 → 2.12 (round half to even)
    expect(Money.toString(Money.toPostingAmount(Money.of("2.125")))).toBe("2.12");
    // 2.135 → 2.14
    expect(Money.toString(Money.toPostingAmount(Money.of("2.135")))).toBe("2.14");
  });

  test("fromDb accepts Decimal-like values via toString", () => {
    const prismaLike = { toString: () => "42.0000" };
    expect(Money.toString(Money.fromDb(prismaLike))).toBe("42");
  });

  test("sum of many values preserves precision", () => {
    const values = Array.from({ length: 100 }, () => Money.of("0.01"));
    expect(Money.toString(Money.sum(values))).toBe("1");
  });

  test("comparisons behave as expected", () => {
    const a = Money.of("100");
    const b = Money.of("99.99");
    expect(Money.gt(a, b)).toBe(true);
    expect(Money.lt(b, a)).toBe(true);
    expect(Money.gte(a, a)).toBe(true);
    expect(Money.lte(a, a)).toBe(true);
  });
});
