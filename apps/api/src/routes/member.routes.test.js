import { beforeEach, describe, expect, it, mock } from "bun:test";
import { createMiddleware } from "hono/factory";

const currentUser = {
  id: "user-1",
  role: "member",
  memberId: "member-1",
};

const dashboardFixture = {
  member: {
    id: "member-1",
    memberId: "MBR-001",
    firstName: "Sarah",
    lastName: "Namusoke",
    email: "sarah@example.com",
    phone: "0700000000",
    country: "UG",
    status: "active",
    joinDate: "2026-04-01T00:00:00.000Z",
    shareCount: 12,
    weddingSupportStatus: "not_received",
    weddingSupportDebt: 0,
    condolenceSupportStatus: "not_received",
    condolenceSupportDebt: 0,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
  },
  accounts: [],
  recentTransactions: [],
  pledges: [],
  transactionSummary: {
    totalDeposits: 0,
    totalWithdrawals: 0,
    monthlySubscriptionTotal: 0,
    transactionCount: 0,
    firstDepositAmount: null,
    firstDepositDate: null,
    latestDepositAmount: null,
    latestDepositDate: null,
  },
  totals: {
    totalBalance: 0,
    accountCount: 0,
    shareCount: 12,
    outstandingLoanBalance: 0,
    activeLoanCount: 0,
    childCount: 0,
    spouseCount: 0,
  },
  socialWelfare: {
    weddings: { status: "not_received", totalDebt: 0 },
    condolences: { status: "not_received", totalDebt: 0 },
    totalPledged: 0,
    activePledges: 0,
  },
};

const reissuedCredentials = { email: "sarah@example.com", tempPassword: "NewPass9xy" };

const serviceFns = {
  getAll: mock(async () => ({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 })),
  getStats: mock(async () => ({ active: 0 })),
  getDashboard: mock(async () => dashboardFixture),
  getById: mock(async () => dashboardFixture.member),
  create: mock(async () => dashboardFixture.member),
  reissueTempPassword: mock(async () => ({ member: dashboardFixture.member, credentials: reissuedCredentials })),
  update: mock(async () => dashboardFixture.member),
  delete: mock(async () => undefined),
};

class MockMemberService {
  getAll(...args) {
    return serviceFns.getAll(...args);
  }

  getStats(...args) {
    return serviceFns.getStats(...args);
  }

  getDashboard(...args) {
    return serviceFns.getDashboard(...args);
  }

  getById(...args) {
    return serviceFns.getById(...args);
  }

  create(...args) {
    return serviceFns.create(...args);
  }

  reissueTempPassword(...args) {
    return serviceFns.reissueTempPassword(...args);
  }

  update(...args) {
    return serviceFns.update(...args);
  }

  delete(...args) {
    return serviceFns.delete(...args);
  }
}

mock.module("../middleware/auth.ts", () => ({
  authMiddleware: createMiddleware(async (c, next) => {
    c.set("user", { ...currentUser });
    await next();
  }),
  requireRole: (...roles) =>
    createMiddleware(async (c, next) => {
      const user = c.get("user");

      if (!user || !roles.includes(user.role)) {
        return c.json({ success: false, message: "Insufficient permissions" }, 403);
      }

      await next();
    }),
}));

mock.module("../services/member.service.ts", () => ({
  MemberService: MockMemberService,
}));

mock.module("../utils/audit.ts", () => ({
  writeAuditLog: mock(async () => {}),
}));

const { memberRoutes } = await import("./member.routes.ts");

describe("/members/me/dashboard", () => {
  beforeEach(() => {
    currentUser.id = "user-1";
    currentUser.role = "member";
    currentUser.memberId = "member-1";

    serviceFns.getDashboard.mockClear();
    serviceFns.getDashboard.mockImplementation(async () => dashboardFixture);
  });

  it("returns the authenticated member dashboard", async () => {
    const response = await memberRoutes.request("/me/dashboard");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      data: dashboardFixture,
    });
    expect(serviceFns.getDashboard).toHaveBeenCalledTimes(1);
    expect(serviceFns.getDashboard).toHaveBeenCalledWith("member-1");
  });

  it("returns 404 when the authenticated member has no linked member profile", async () => {
    currentUser.memberId = null;

    const response = await memberRoutes.request("/me/dashboard");
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      success: false,
      message: "Member profile not found",
    });
    expect(serviceFns.getDashboard).not.toHaveBeenCalled();
  });

  it("rejects non-member roles before loading the dashboard", async () => {
    currentUser.role = "staff";

    const response = await memberRoutes.request("/me/dashboard");
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      success: false,
      message: "Insufficient permissions",
    });
    expect(serviceFns.getDashboard).not.toHaveBeenCalled();
  });
});

describe("POST /:id/reissue-credentials — staff lockout recovery", () => {
  beforeEach(() => {
    currentUser.id = "user-1";
    currentUser.role = "admin";
    currentUser.memberId = null;
    serviceFns.reissueTempPassword.mockClear();
  });

  it("returns a fresh one-time password for an admin", async () => {
    const response = await memberRoutes.request("/member-1/reissue-credentials", { method: "POST" });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.credentials).toEqual(reissuedCredentials);
    expect(serviceFns.reissueTempPassword).toHaveBeenCalledWith("member-1");
  });

  it("allows staff to re-issue too", async () => {
    currentUser.role = "staff";
    const response = await memberRoutes.request("/member-1/reissue-credentials", { method: "POST" });

    expect(response.status).toBe(200);
    expect(serviceFns.reissueTempPassword).toHaveBeenCalledTimes(1);
  });

  it("forbids a member from re-issuing credentials", async () => {
    currentUser.role = "member";
    const response = await memberRoutes.request("/member-1/reissue-credentials", { method: "POST" });

    expect(response.status).toBe(403);
    expect(serviceFns.reissueTempPassword).not.toHaveBeenCalled();
  });
});
