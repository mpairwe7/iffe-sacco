"use client";

import { useRef, useState } from "react";
import { UploadCloud, File as FileIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  /** Accepted MIME types — defaults to the server allowlist (images + PDF). */
  accept?: string;
  maxSizeMb?: number;
  disabled?: boolean;
  onError?: (message: string) => void;
}

export function FileUpload({
  value,
  onChange,
  accept = "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf",
  maxSizeMb = 10,
  disabled = false,
  onError,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function pick(file: File | undefined | null) {
    if (!file) return;
    if (file.size > maxSizeMb * 1024 * 1024) {
      onError?.(`File is too large (maximum ${maxSizeMb} MB)`);
      return;
    }
    // The native picker enforces `accept`, but drag-and-drop bypasses it — so
    // re-check the MIME type here. (Empty type: defer to the server's check.)
    const allowed = accept
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (allowed.length > 0 && file.type && !allowed.includes(file.type)) {
      onError?.("Unsupported file type. Upload a JPG, PNG, WEBP or HEIC image, or a PDF.");
      return;
    }
    onChange(file);
  }

  function clear() {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-white/60 dark:bg-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <FileIcon className="w-5 h-5 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-text truncate">{value.name}</p>
            <p className="text-xs text-text-muted">{(value.size / 1024).toFixed(0)} KB</p>
          </div>
        </div>
        <button
          type="button"
          onClick={clear}
          disabled={disabled}
          className="shrink-0 p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 disabled:opacity-50"
          aria-label="Remove file"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!disabled) pick(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
      )}
    >
      <UploadCloud className="w-8 h-8 text-text-muted" />
      <p className="text-sm font-medium text-text">Tap to scan or upload a file</p>
      <p className="text-xs text-text-muted">JPG, PNG, WEBP, HEIC or PDF &bull; up to {maxSizeMb} MB</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
}
