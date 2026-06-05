import { beforeEach, describe, expect, it, mock } from "bun:test";
import { createMiddleware } from "hono/factory";

// We exercise the REAL routes AND the REAL service, mocking only the DB layer.
// (Mocking the service module here would leak globally via bun's mock.module and
// break any direct service test, so we mock ../config/db instead.)
const currentUser = { id: "user-1", role: "staff", memberId: null };

const db = {
  findUnique: mock(async () => ({ id: "app-1", status: "pending", fullName: "Jane Doe" })),
  updateMany: mock(async () => ({ count: 1 })),
  findMany: mock(async () => []),
  count: mock(async () => 0),
};
const application = {
  findUnique: (...a) => db.findUnique(...a),
  updateMany: (...a) => db.updateMany(...a),
  findMany: (...a) => db.findMany(...a),
  count: (...a) => db.count(...a),
};

mock.module("../config/db.ts", () => ({
  prisma: { application },
  // The transaction guards throw before any creation, so a tx that only exposes
  // `application` is enough to drive every status-transition assertion.
  withTx: async (cb) => cb({ application }),
}));

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

mock.module("../middleware/empty-body.ts", () => ({
  requireEmptyBody: createMiddleware(async (_c, next) => next()),
}));

const auditFns = { writeAuditLog: mock(async () => undefined) };
mock.module("../utils/audit.ts", () => ({
  writeAuditLog: (...args) => auditFns.writeAuditLog(...args),
}));

const { applicationRoutes } = await import("./application.routes.ts");
const { ApplicationService } = await import("../services/application.service.ts");
const svc = new ApplicationService();

function setUser(role) {
  currentUser.id = "user-1";
  currentUser.role = role;
  currentUser.memberId = null;
}

function jsonReq(path, method, body) {
  return applicationRoutes.request(path, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
}

beforeEach(() => {
  setUser("staff");
  Object.values(db).forEach((fn) => fn.mockClear());
  auditFns.writeAuditLog.mockClear();
  db.findUnique.mockImplementation(async () => ({ id: "app-1", status: "pending", fullName: "Jane Doe" }));
  db.updateMany.mockImplementation(async () => ({ count: 1 }));
  db.findMany.mockImplementation(async () => []);
  db.count.mockImplementation(async () => 0);
});

// ===== Route role-gating & wiring =====

describe("PUT /applications/:id/recommend (staff)", () => {
  it("staff recommends a pending application → recommended + audit", async () => {
    const res = await jsonReq("/app-1/recommend", "PUT", { notes: "Requirements met" });
    expect(res.status).toBe(200);
    const claim = db.updateMany.mock.calls[0][0];
    expect(claim.data.status).toBe("recommended");
    expect(claim.data.recommendedBy).toBe("user-1");
    expect(claim.data.recommendationNotes).toBe("Requirements met");
    expect(auditFns.writeAuditLog.mock.calls[0][1].action).toBe("application_recommended");
  });

  it("accepts an empty body (notes optional)", async () => {
    const res = await jsonReq("/app-1/recommend", "PUT", {});
    expect(res.status).toBe(200);
  });

  it("forbids admins from recommending", async () => {
    setUser("admin");
    const res = await jsonReq("/app-1/recommend", "PUT", { notes: "x" });
    expect(res.status).toBe(403);
    expect(db.updateMany).not.toHaveBeenCalled();
  });
});

describe("PUT /applications/:id/decline (staff)", () => {
  it("staff declines with a reason → rejected + audit", async () => {
    const res = await jsonReq("/app-1/decline", "PUT", { reason: "Missing documents" });
    expect(res.status).toBe(200);
    const claim = db.updateMany.mock.calls[0][0];
    expect(claim.data.status).toBe("rejected");
    expect(claim.data.rejectionReason).toBe("Missing documents");
    expect(auditFns.writeAuditLog.mock.calls[0][1].action).toBe("application_declined");
  });

  it("rejects a decline with no reason (400, never reaches the service)", async () => {
    const res = await jsonReq("/app-1/decline", "PUT", {});
    expect(res.status).toBe(400);
    expect(db.updateMany).not.toHaveBeenCalled();
  });

  it("forbids admins from declining", async () => {
    setUser("admin");
    const res = await jsonReq("/app-1/decline", "PUT", { reason: "x" });
    expect(res.status).toBe(403);
  });
});

describe("PUT /applications/:id/approve (admin, strict)", () => {
  it("forbids staff from approving", async () => {
    const res = await applicationRoutes.request("/app-1/approve", { method: "PUT" });
    expect(res.status).toBe(403);
    expect(db.updateMany).not.toHaveBeenCalled();
  });

  it("admin CANNOT approve a still-pending application (400)", async () => {
    setUser("admin");
    db.findUnique.mockImplementation(async () => ({ id: "app-1", status: "pending", fullName: "Jane Doe" }));
    const res = await applicationRoutes.request("/app-1/approve", { method: "PUT" });
    expect(res.status).toBe(400);
    expect(auditFns.writeAuditLog).not.toHaveBeenCalled();
  });
});

describe("PUT /applications/:id/reject (admin)", () => {
  it("admin rejects with a reason → rejected + audit", async () => {
    setUser("admin");
    db.findUnique.mockImplementation(async () => ({ id: "app-1", status: "recommended", fullName: "Jane Doe" }));
    const res = await jsonReq("/app-1/reject", "PUT", { status: "rejected", rejectionReason: "Not eligible" });
    expect(res.status).toBe(200);
    expect(auditFns.writeAuditLog.mock.calls[0][1].action).toBe("application_rejected");
  });

  it("forbids staff from rejecting via the admin route", async () => {
    const res = await jsonReq("/app-1/reject", "PUT", { status: "rejected", rejectionReason: "x" });
    expect(res.status).toBe(403);
  });
});

describe("GET /applications (list)", () => {
  it("forbids the member role", async () => {
    setUser("member");
    const res = await applicationRoutes.request("/");
    expect(res.status).toBe(403);
  });

  it("allows staff to list", async () => {
    const res = await applicationRoutes.request("/");
    expect(res.status).toBe(200);
  });
});

// ===== Service-level state machine (strict gate) =====

describe("ApplicationService transitions", () => {
  it("admin cannot approve a pending application", async () => {
    db.findUnique.mockImplementation(async () => ({ id: "app-1", status: "pending", fullName: "Jane Doe" }));
    await expect(svc.approve("app-1", "admin-1")).rejects.toThrow("staff-recommended");
  });

  it("approve gets PAST the gate for a recommended application", async () => {
    db.findUnique.mockImplementation(async () => ({ id: "app-1", status: "recommended", fullName: "Jane Doe" }));
    // Creation steps after the gate aren't mocked, so swallow the later error;
    // the claim updateMany proves we cleared the recommended gate.
    await svc.approve("app-1", "admin-1").catch(() => {});
    const claim = db.updateMany.mock.calls[0]?.[0];
    expect(claim?.where?.status).toBe("recommended");
    expect(claim?.data?.status).toBe("approved");
  });

  it("cannot recommend a non-pending application", async () => {
    db.findUnique.mockImplementation(async () => ({ id: "app-1", status: "recommended" }));
    await expect(svc.recommend("app-1", "staff-1")).rejects.toThrow("pending");
  });

  it("cannot decline a non-pending application", async () => {
    db.findUnique.mockImplementation(async () => ({ id: "app-1", status: "approved" }));
    await expect(svc.decline("app-1", "staff-1", "x")).rejects.toThrow("pending");
  });

  it("cannot reject an approved application", async () => {
    db.findUnique.mockImplementation(async () => ({ id: "app-1", status: "approved" }));
    await expect(svc.reject("app-1", "admin-1", "x")).rejects.toThrow("pending or recommended");
  });
});
