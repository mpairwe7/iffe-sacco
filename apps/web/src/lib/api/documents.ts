import { apiClient } from "@/lib/api-client";
import type { MemberDocument } from "@iffe/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export const documentsApi = {
  /** The signed-in member's own documents. */
  myDocuments: () => apiClient.get<MemberDocument[]>("/documents/me"),
  /** Documents for a given member (staff/admin/chairman). */
  memberDocuments: (memberId: string) => apiClient.get<MemberDocument[]>("/documents", { memberId }),
  /** Upload a document (multipart: file, memberId, type, label). */
  upload: (formData: FormData) => apiClient.postFormData<MemberDocument>("/documents", formData),
  /** Delete a document (staff/admin). */
  remove: (id: string) => apiClient.del<void>(`/documents/${id}`),
};

/**
 * URL for viewing or downloading a stored document. The endpoint is auth-gated;
 * a same-site navigation (link / new tab) sends the session cookie automatically,
 * so a plain <a href> works. `download: true` forces a save instead of inline view.
 */
export function documentFileUrl(id: string, opts?: { download?: boolean }) {
  return `${API_BASE}/documents/${id}/file${opts?.download ? "?download=1" : ""}`;
}
