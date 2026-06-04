import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod/v4";
import { uploadDocumentSchema } from "@iffe/shared";
import { DocumentService } from "../services/document.service";
import { authMiddleware, requireRole, type AuthEnv } from "../middleware/auth";
import { writeAuditLog } from "../utils/audit";

const documents = new Hono<AuthEnv>();
const service = new DocumentService();

documents.use("*", authMiddleware);

// Member: list their own documents (Receipts tab).
documents.get("/me", requireRole("member"), async (c) => {
  const user = c.get("user");
  if (!user.memberId) {
    return c.json({ success: false, message: "Member profile not found" }, 404);
  }
  const docs = await service.listForMember(user.memberId);
  return c.json({ success: true, data: docs });
});

// Staff/admin/chairman: list documents for a given member.
documents.get(
  "/",
  requireRole("admin", "staff", "chairman"),
  zValidator("query", z.object({ memberId: z.string().min(1, "memberId required") })),
  async (c) => {
    const { memberId } = c.req.valid("query");
    const docs = await service.listForMember(memberId);
    return c.json({ success: true, data: docs });
  },
);

// Staff/admin: upload (scan) a document for a member. multipart/form-data with
// fields: file, memberId, type, label. The file is validated in the service.
documents.post("/", requireRole("admin", "staff"), async (c) => {
  const user = c.get("user");
  const body = await c.req.parseBody();

  const file = body.file;
  if (!(file instanceof File)) {
    return c.json({ success: false, message: "A file is required" }, 400);
  }

  // Validate the accompanying metadata with the shared schema (throws ZodError
  // → 422 via the global error handler on bad input).
  const meta = uploadDocumentSchema.parse({
    memberId: body.memberId,
    type: typeof body.type === "string" && body.type ? body.type : "receipt",
    label: typeof body.label === "string" && body.label.trim() ? body.label.trim() : undefined,
  });

  const doc = await service.create({
    memberId: meta.memberId,
    type: meta.type,
    label: meta.label,
    uploadedBy: user.id,
    file,
  });

  await writeAuditLog(c, {
    action: "document_uploaded",
    entity: "document",
    entityId: doc.id,
    details: { memberId: doc.memberId, type: doc.type, originalName: doc.originalName, size: doc.size },
  });

  return c.json({ success: true, data: doc }, 201);
});

// Owner member OR staff/admin/chairman: stream a document for view/download.
// GET carries the session cookie automatically (same-site), so a plain link or
// new-tab navigation works; `?download=1` forces a download instead of inline.
documents.get("/:id/file", async (c) => {
  const user = c.get("user");
  const doc = await service.getById(c.req.param("id"));

  const isOwner = !!user.memberId && doc.memberId === user.memberId;
  const isStaff = ["admin", "staff", "chairman"].includes(user.role);
  if (!isOwner && !isStaff) {
    return c.json({ success: false, message: "Insufficient permissions" }, 403);
  }

  const buffer = await service.readFile(doc.storedName);
  const disposition = c.req.query("download") === "1" ? "attachment" : "inline";
  const safeName = encodeURIComponent(doc.originalName);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Length": String(doc.size),
      "Content-Disposition": `${disposition}; filename*=UTF-8''${safeName}`,
      // User-uploaded content served inline — stop browsers from MIME-sniffing
      // it into something executable.
      "X-Content-Type-Options": "nosniff",
      // Member-owned records — never store in a shared cache.
      "Cache-Control": "private, no-store",
    },
  });
});

// Staff/admin: delete a document (members cannot — this is a record store).
documents.delete("/:id", requireRole("admin", "staff"), async (c) => {
  const doc = await service.delete(c.req.param("id"));
  await writeAuditLog(c, {
    action: "document_deleted",
    entity: "document",
    entityId: doc.id,
    details: { memberId: doc.memberId, originalName: doc.originalName },
  });
  return c.json({ success: true, message: "Document deleted" });
});

export { documents as documentRoutes };
