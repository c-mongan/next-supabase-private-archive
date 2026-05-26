"use client";

import { useCallback, useEffect, useRef } from "react";

export type FilePreview =
  | { kind: "pdf"; url: string }
  | { kind: "html"; html: string; truncated?: boolean }
  | { kind: "text"; text: string; truncated?: boolean }
  | { kind: "unavailable"; reason: string };

type FilePreviewModalProps = {
  preview: FilePreview | null;
  filename: string;
  fileId: string;
  open: boolean;
  onClose: () => void;
};

export function FilePreviewModal({
  preview,
  filename,
  fileId,
  open,
  onClose,
}: FilePreviewModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const raf = window.requestAnimationFrame(() => dialogRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(raf);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open]);

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={filename}
        tabIndex={-1}
        className="relative flex h-[88vh] w-full max-w-7xl flex-col overflow-hidden rounded-lg bg-white shadow-xl outline-none"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <p className="truncate text-sm font-medium text-slate-950" title={filename}>
            {filename}
          </p>
          <div className="flex items-center gap-1">
            <a
              href={`/api/downloads/${fileId}`}
              className="rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Download original
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
              aria-label="Close file preview"
            >
              Close
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 bg-slate-100">
          {!preview ? (
            <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
              Loading preview...
            </div>
          ) : null}
          {preview?.kind === "pdf" ? (
            <iframe src={preview.url} title={filename} className="h-full w-full border-0" />
          ) : null}
          {preview?.kind === "html" ? (
            <iframe
              srcDoc={preview.html}
              title={filename}
              sandbox=""
              className="h-full w-full border-0 bg-white"
            />
          ) : null}
          {preview?.kind === "text" ? (
            <div className="h-full overflow-auto bg-white p-6 text-sm leading-6 text-slate-900">
              {preview.truncated ? (
                <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                  Preview truncated for performance.
                </p>
              ) : null}
              <pre className="whitespace-pre-wrap font-sans">{preview.text}</pre>
            </div>
          ) : null}
          {preview?.kind === "unavailable" ? (
            <div className="flex h-full w-full items-center justify-center p-6">
              <div className="max-w-lg rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
                <p className="text-sm font-medium text-slate-950">Preview unavailable</p>
                <p className="mt-2 text-sm text-slate-600">{preview.reason}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
