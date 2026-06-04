import { beforeEach, describe, expect, it, mock } from "bun:test";
import { createMiddleware } from "hono/factory";

const currentUser = {
  id: "user-1",
  role: "member",
  memberId: "member-1",
};

const docFixture = {
  id: "doc-1",
  memberId: "member-1",
  type: "receipt",
  label: "June receipt",
  originalName: "receipt.png",
  storedName: "abc-123.png",
  mimeType: "image/png",
  size: 1234,
  uploadedBy: "user-9",
  createdAt: "2026-06-01T00:00:00.000Z",
};

const serviceFns = {
  listForMember: mock(async () => [docFixture]),
  getById: mock(async () => docFixture),
  create: mock(async () => docFixture),
  delete: mock(async () => docFixture),
  readFile: mock(async () => Buffer.from("PNGDATA")),
};

class MockDocumentService {
  listForMember(...args) {
    return serviceFns.listForMember(...args);
  }
  getById(...args) {
    return serviceFns.getById(...args);
  }
  create(...args) {
    return serviceFns.create(...args);
  }
  delete(...args) {
    return serviceFns.delete(...args);
  }
  readFile(...args) {
    return serviceFns.readFile(...args);
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

mock.module("../services/document.service.ts", () => ({
  DocumentService: MockDocumentService,
}));

const auditFns = { writeAuditLog: mock(async () => undefined) };
mock.module("../utils/audit.ts", () => ({
  writeAuditLog: (...args) => auditFns.writeAuditLog(...args),
}));

const { documentRoutes } = await import("./document.routes.ts");

function resetUser() {
  currentUser.id = "user-1";
  currentUser.role = "member";
  currentUser.memberId = "member-1";
}

describe("GET /documents/me", () => {
  beforeEach(() => {
    resetUser();
    serviceFns.listForMember.mockClear();
    serviceFns.listForMember.mockImplementation(async () => [docFixture]);
  });

  it("returns the member's own documents", async () => {
    const res = await documentRoutes.request("/me");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, data: [docFixture] });
    expect(serviceFns.listForMember).toHaveBeenCalledWith("member-1");
  });

  it("returns 404 when the member has no linked profile", async () => {
    currentUser.memberId = null;

    const res = await documentRoutes.request("/me");

    expect(res.status).toBe(404);
    expect(serviceFns.listForMember).not.toHaveBeenCalled();
  });

  it("rejects non-member roles", async () => {
    currentUser.role = "staff";

    const res = await documentRoutes.request("/me");

    expect(res.status).toBe(403);
  });
});

describe("GET /documents (by member)", () => {
  beforeEach(() => {
    resetUser();
    serviceFns.listForMember.mockClear();
  });

  it("rejects the member role (staff/admin/chairman only)", async () => {
    const res = await documentRoutes.request("/?memberId=member-1");

    expect(res.status).toBe(403);
    expect(serviceFns.listForMember).not.toHaveBeenCalled();
  });

  it("returns documents for staff", async () => {
    currentUser.role = "staff";

    const res = await documentRoutes.request("/?memberId=member-7");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(serviceFns.listForMember).toHaveBeenCalledWith("member-7");
  });
});

describe("GET /documents/:id/file", () => {
  beforeEach(() => {
    resetUser();
    serviceFns.getById.mockClear();
    serviceFns.readFile.mockClear();
    serviceFns.getById.mockImplementation(async () => docFixture);
    serviceFns.readFile.mockImplementation(async () => Buffer.from("PNGDATA"));
  });

  it("streams inline to the owner member with security headers", async () => {
    const res = await documentRoutes.request("/doc-1/file");

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("content-disposition")).toContain("inline");
    expect(res.headers.get("content-disposition")).toContain("receipt.png");
    expect(serviceFns.readFile).toHaveBeenCalledWith("abc-123.png");
  });

  it("forces a download when ?download=1", async () => {
    const res = await documentRoutes.request("/doc-1/file?download=1");

    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toContain("attachment");
  });

  it("blocks a member who is not the owner", async () => {
    currentUser.memberId = "someone-else";

    const res = await documentRoutes.request("/doc-1/file");

    expect(res.status).toBe(403);
    expect(serviceFns.readFile).not.toHaveBeenCalled();
  });

  it("allows staff to stream any member's document", async () => {
    currentUser.role = "staff";
    currentUser.memberId = null;

    const res = await documentRoutes.request("/doc-1/file");

    expect(res.status).toBe(200);
    expect(serviceFns.readFile).toHaveBeenCalled();
  });
});

describe("POST /documents", () => {
  beforeEach(() => {
    resetUser();
    serviceFns.create.mockClear();
    auditFns.writeAuditLog.mockClear();
    serviceFns.create.mockImplementation(async () => docFixture);
  });

  it("rejects the member role", async () => {
    const fd = new FormData();
    fd.append("memberId", "member-1");
    fd.append("file", new File([new Uint8Array([1, 2, 3])], "r.png", { type: "image/png" }));

    const res = await documentRoutes.request("/", { method: "POST", body: fd });

    expect(res.status).toBe(403);
    expect(serviceFns.create).not.toHaveBeenCalled();
  });

  it("returns 400 when no file is attached", async () => {
    currentUser.role = "staff";
    const fd = new FormData();
    fd.append("memberId", "member-1");
    fd.append("type", "receipt");

    const res = await documentRoutes.request("/", { method: "POST", body: fd });

    expect(res.status).toBe(400);
    expect(serviceFns.create).not.toHaveBeenCalled();
  });

  it("uploads a document as staff and writes an audit log", async () => {
    currentUser.role = "staff";
    const fd = new FormData();
    fd.append("memberId", "member-1");
    fd.append("type", "signed_form");
    fd.append("label", "Signed mandate");
    fd.append("file", new File([new Uint8Array([1, 2, 3])], "form.pdf", { type: "application/pdf" }));

    const res = await documentRoutes.request("/", { method: "POST", body: fd });
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toEqual({ success: true, data: docFixture });
    expect(serviceFns.create).toHaveBeenCalledTimes(1);
    const arg = serviceFns.create.mock.calls[0][0];
    expect(arg.memberId).toBe("member-1");
    expect(arg.type).toBe("signed_form");
    expect(arg.label).toBe("Signed mandate");
    expect(arg.uploadedBy).toBe("user-1");
    expect(arg.file).toBeInstanceOf(File);
    expect(auditFns.writeAuditLog).toHaveBeenCalledTimes(1);
  });
});

describe("DELETE /documents/:id", () => {
  beforeEach(() => {
    resetUser();
    serviceFns.delete.mockClear();
    auditFns.writeAuditLog.mockClear();
    serviceFns.delete.mockImplementation(async () => docFixture);
  });

  it("rejects the member role", async () => {
    const res = await documentRoutes.request("/doc-1", { method: "DELETE" });

    expect(res.status).toBe(403);
    expect(serviceFns.delete).not.toHaveBeenCalled();
  });

  it("deletes as staff and writes an audit log", async () => {
    currentUser.role = "staff";

    const res = await documentRoutes.request("/doc-1", { method: "DELETE" });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(serviceFns.delete).toHaveBeenCalledWith("doc-1");
    expect(auditFns.writeAuditLog).toHaveBeenCalledTimes(1);
  });
});
