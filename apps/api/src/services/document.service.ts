import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { HTTPException } from "hono/http-exception";
import type { DocumentType } from "@iffe/shared";
import { prisma } from "../config/db";
import { env } from "../config/env";

const DOCUMENTS_SUBDIR = "documents";

/** Hard cap on a single upload. Receipts/scans and signed PDFs are well under this. */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Upload allowlist: scanned receipts (photos), and PDFs for signed forms.
 * Maps the browser-reported MIME type to the canonical on-disk extension so we
 * never derive the extension from an untrusted client filename.
 */
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "application/pdf": ".pdf",
};

export const ALLOWED_DOCUMENT_MIME_TYPES = Object.keys(ALLOWED_MIME);

function storageRoot() {
  return path.resolve(env.STORAGE_DIR, DOCUMENTS_SUBDIR);
}

export class DocumentService {
  /** All documents for a member, newest first. */
  async listForMember(memberId: string) {
    return prisma.document.findMany({
      where: { memberId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) throw new HTTPException(404, { message: "Document not found" });
    return doc;
  }

  /** Persist the file to disk and record its metadata. */
  async create(input: { memberId: string; type: DocumentType; label?: string; uploadedBy: string; file: File }) {
    const member = await prisma.member.findUnique({ where: { id: input.memberId } });
    if (!member) throw new HTTPException(404, { message: "Member not found" });

    const ext = ALLOWED_MIME[input.file.type];
    if (!ext) {
      throw new HTTPException(415, {
        message: "Unsupported file type. Upload a JPG, PNG, WEBP or HEIC image, or a PDF.",
      });
    }

    const size = input.file.size;
    if (size <= 0) throw new HTTPException(400, { message: "File is empty" });
    if (size > MAX_DOCUMENT_BYTES) {
      throw new HTTPException(413, { message: "File is too large (maximum 10 MB)" });
    }

    const storedName = `${randomUUID()}${ext}`;
    const root = storageRoot();
    await mkdir(root, { recursive: true });
    const buffer = Buffer.from(await input.file.arrayBuffer());
    await writeFile(path.join(root, storedName), buffer);

    return prisma.document.create({
      data: {
        memberId: input.memberId,
        type: input.type,
        label: input.label,
        originalName: input.file.name || `document${ext}`,
        storedName,
        mimeType: input.file.type,
        size,
        uploadedBy: input.uploadedBy,
      },
    });
  }

  /** Read raw bytes for a stored document. `storedName` is server-generated. */
  async readFile(storedName: string): Promise<Buffer> {
    // Defence-in-depth: storedName is a uuid+ext we generated, but never let a
    // value with path separators reach the filesystem join.
    if (storedName.includes("/") || storedName.includes("\\") || storedName.includes("..")) {
      throw new HTTPException(400, { message: "Invalid document reference" });
    }
    try {
      return await readFile(path.join(storageRoot(), storedName));
    } catch {
      throw new HTTPException(404, { message: "Document file is missing" });
    }
  }

  /** Remove the DB row and best-effort delete the file. */
  async delete(id: string) {
    const doc = await this.getById(id);
    await prisma.document.delete({ where: { id } });
    try {
      await unlink(path.join(storageRoot(), doc.storedName));
    } catch (err) {
      // The row is the source of truth; a missing file shouldn't fail the delete.
      console.error("Failed to remove document file", doc.storedName, err);
    }
    return doc;
  }
}
