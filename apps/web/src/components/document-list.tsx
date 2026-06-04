"use client";

import { FileText, Image as ImageIcon, Download, Eye, Trash2 } from "lucide-react";
import type { MemberDocument } from "@iffe/shared";
import { documentFileUrl } from "@/lib/api/documents";

const TYPE_LABEL: Record<string, string> = {
  receipt: "Receipt",
  signed_form: "Signed form",
  other: "Document",
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

interface DocumentListProps {
  documents: MemberDocument[];
  isLoading?: boolean;
  emptyMessage?: string;
  /** When provided, a delete action is shown per row (staff/admin). */
  onDelete?: (doc: MemberDocument) => void;
  deletingId?: string | null;
}

export function DocumentList({
  documents,
  isLoading = false,
  emptyMessage = "No documents yet.",
  onDelete,
  deletingId = null,
}: DocumentListProps) {
  if (isLoading) {
    return <div className="py-10 text-center text-sm text-text-muted">Loading documents&hellip;</div>;
  }

  if (documents.length === 0) {
    return <div className="py-10 text-center text-sm text-text-muted">{emptyMessage}</div>;
  }

  return (
    <ul className="divide-y divide-border/40">
      {documents.map((doc) => {
        const Icon = doc.mimeType.startsWith("image/") ? ImageIcon : FileText;
        return (
          <li key={doc.id} className="flex items-center gap-3 py-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text truncate">{doc.label || doc.originalName}</p>
              <p className="text-xs text-text-muted">
                {TYPE_LABEL[doc.type] ?? "Document"} &bull; {formatBytes(doc.size)} &bull; {formatDate(doc.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <a
                href={documentFileUrl(doc.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10"
                aria-label="View document"
                title="View"
              >
                <Eye className="w-4 h-4" />
              </a>
              <a
                href={documentFileUrl(doc.id, { download: true })}
                className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10"
                aria-label="Download document"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </a>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(doc)}
                  disabled={deletingId === doc.id}
                  className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 disabled:opacity-50"
                  aria-label="Delete document"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
