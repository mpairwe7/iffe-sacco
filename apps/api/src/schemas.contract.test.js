import { describe, expect, it } from "bun:test";
import {
  registerSchema,
  loginSchema,
  recommendApplicationSchema,
  declineApplicationSchema,
  passwordSchema,
  setInitialPasswordSchema,
  changePasswordSchema,
} from "@iffe/shared";

const validRegistration = {
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "+256700000000",
  password: "password1",
};

describe("registerSchema — a client cannot inject a role (privilege-escalation guard)", () => {
  it("strips any client-supplied role from the parsed output", () => {
    const parsed = registerSchema.parse({ ...validRegistration, role: "admin" });
    expect("role" in parsed).toBe(false);
  });

  it("accepts a valid member registration", () => {
    expect(registerSchema.safeParse(validRegistration).success).toBe(true);
  });

  it("requires name, email, phone and password", () => {
    expect(registerSchema.safeParse({ email: "jane@example.com" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validRegistration, password: "short" }).success).toBe(false);
  });
});

describe("loginSchema — portal door is accepted and validated", () => {
  it("accepts each valid portal", () => {
    for (const portal of ["member", "staff", "admin"]) {
      expect(loginSchema.safeParse({ email: "jane@example.com", password: "secret1", portal }).success).toBe(true);
    }
  });

  it("allows omitting portal (API clients without a door)", () => {
    expect(loginSchema.safeParse({ email: "jane@example.com", password: "secret1" }).success).toBe(true);
  });

  it("rejects an unknown portal value", () => {
    expect(
      loginSchema.safeParse({ email: "jane@example.com", password: "secret1", portal: "superadmin" }).success,
    ).toBe(false);
  });
});

describe("recommend / decline application schemas", () => {
  it("recommend notes are optional", () => {
    expect(recommendApplicationSchema.safeParse({}).success).toBe(true);
    expect(recommendApplicationSchema.safeParse({ notes: "Requirements met" }).success).toBe(true);
  });

  it("recommend rejects overly long notes", () => {
    expect(recommendApplicationSchema.safeParse({ notes: "x".repeat(1001) }).success).toBe(false);
  });

  it("decline requires a non-empty reason", () => {
    expect(declineApplicationSchema.safeParse({}).success).toBe(false);
    expect(declineApplicationSchema.safeParse({ reason: "" }).success).toBe(false);
    expect(declineApplicationSchema.safeParse({ reason: "Missing documents" }).success).toBe(true);
  });
});

describe("password policy — minimum length only, enforced server-side", () => {
  it("accepts 8+ characters and rejects shorter", () => {
    expect(passwordSchema.safeParse("abcd1234").success).toBe(true);
    expect(passwordSchema.safeParse("abc123").success).toBe(false);
  });

  it("does not require complexity — a long lowercase-only password is valid", () => {
    // The UI must not advertise rules the API doesn't enforce: no upper/number/
    // special requirement, only length.
    expect(setInitialPasswordSchema.safeParse({ newPassword: "allowercaseok" }).success).toBe(true);
    expect(setInitialPasswordSchema.safeParse({ newPassword: "short" }).success).toBe(false);
  });

  it("change-password requires a current password and a valid new one", () => {
    expect(changePasswordSchema.safeParse({ currentPassword: "x", newPassword: "abcd1234" }).success).toBe(true);
    expect(changePasswordSchema.safeParse({ currentPassword: "", newPassword: "abcd1234" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ currentPassword: "x", newPassword: "short" }).success).toBe(false);
  });
});
