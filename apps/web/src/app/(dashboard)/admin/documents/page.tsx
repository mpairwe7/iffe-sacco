"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import type { MemberDocument } from "@iffe/shared";
import { useAuthStore } from "@/stores/auth-store";
import { useMembers } from "@/hooks/use-members";
import { useMemberDocuments, useUploadDocument, useDeleteDocument } from "@/hooks/use-documents";
import { FileUpload } from "@/components/file-upload";
import { DocumentList } from "@/components/document-list";

const DOC_TYPES = [
  { value: "receipt", label: "Receipt" },
  { value: "signed_form", label: "Signed form" },
  { value: "other", label: "Other" },
] as const;

export default function StaffDocumentsPage() {
  const router = useRouter();
  const userRole = useAuthStore((s) => s.user?.role);

  useEffect(() => {
    if (userRole && userRole !== "admin" && userRole !== "staff") {
      toast.error("Only staff or administrators can manage documents");
      router.replace("/admin/members");
    }
  }, [userRole, router]);

  const membersQuery = useMembers({ limit: 500, sortBy: "firstName", sortOrder: "asc" });
  const members = useMemo(() => membersQuery.data?.data ?? [], [membersQuery.data]);

  const [memberId, setMemberId] = useState("");
  const [docType, setDocType] = useState<string>("receipt");
  const [label, setLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [docToDelete, setDocToDelete] = useState<MemberDocument | null>(null);

  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();
  const docsQuery = useMemberDocuments(memberId);

  const selectedMember = useMemo(() => members.find((m) => m.id === memberId), [members, memberId]);

  async function handleUpload() {
    if (!memberId) {
      toast.error("Select a member first");
      return;
    }
    if (!file) {
      toast.error("Choose a file to upload");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("memberId", memberId);
    fd.append("type", docType);
    if (label.trim()) fd.append("label", label.trim());

    try {
      await uploadDoc.mutateAsync(fd);
      toast.success("Document uploaded");
      setFile(null);
      setLabel("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function confirmDelete() {
    if (!docToDelete) return;
    try {
      await deleteDoc.mutateAsync(docToDelete.id);
      toast.success("Document deleted");
      setDocToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Member Documents</h1>
          <p className="text-text-muted text-sm">Scan and file receipts &amp; signed forms for members</p>
        </div>
      </div>

      {/* Upload form */}
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-text mb-2">Member *</label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">{membersQuery.isLoading ? "Loading members…" : "Select a member"}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.memberId} &mdash; {m.firstName} {m.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Document type *</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-text mb-2">Label / note (optional)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={200}
              placeholder="e.g. June savings deposit receipt"
              className="w-full px-4 py-2.5 bg-white/60 border border-white/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <FileUpload value={file} onChange={setFile} onError={(m) => toast.error(m)} disabled={uploadDoc.isPending} />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploadDoc.isPending || !memberId || !file}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {uploadDoc.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            Upload document
          </button>
        </div>
      </div>

      {/* Existing documents for the selected member */}
      {memberId && (
        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl p-4 lg:p-6">
          <h3 className="text-base font-semibold text-text mb-1">
            Filed documents
            {selectedMember ? ` — ${selectedMember.firstName} ${selectedMember.lastName}` : ""}
          </h3>
          <p className="text-xs text-text-muted mb-3">The member sees these in their Receipts tab.</p>
          <DocumentList
            documents={docsQuery.data ?? []}
            isLoading={docsQuery.isLoading}
            emptyMessage="No documents filed for this member yet."
            onDelete={(doc) => setDocToDelete(doc)}
            deletingId={deleteDoc.isPending ? (docToDelete?.id ?? null) : null}
          />
        </div>
      )}

      {/* Delete confirmation */}
      {docToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold text-text mb-1">Delete document?</h2>
            <p className="text-sm text-text-muted mb-5">
              &ldquo;{docToDelete.label || docToDelete.originalName}&rdquo; will be permanently removed. This cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                disabled={deleteDoc.isPending}
                className="px-5 py-2.5 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-surface-alt disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteDoc.isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-danger rounded-lg hover:bg-danger/90 disabled:opacity-50"
              >
                {deleteDoc.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
