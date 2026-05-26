"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye } from "lucide-react";
import {
  FilePreviewModal,
  type FilePreview,
} from "@/components/files/file-preview-modal";
import { Button } from "@/components/ui/button";

type PreviewResponse =
  | { kind: "html"; html: string; truncated?: boolean }
  | { kind: "text"; text: string; truncated?: boolean }
  | { kind: "unavailable"; reason: string };

export function FilePreviewButton({
  fileId,
  filename,
}: {
  fileId: string;
  filename: string;
}) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (preview?.kind === "pdf") URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  const handleOpen = useCallback(async () => {
    setOpen(true);
    setError(null);
    setPreview(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/previews/${fileId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        setError(`Preview unavailable (${res.status}).`);
        return;
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/pdf")) {
        const blob = await res.blob();
        setPreview({ kind: "pdf", url: URL.createObjectURL(blob) });
      } else {
        const json = (await res.json()) as PreviewResponse;
        setPreview(json);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed.");
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setError(null);
    setPreview((current) => {
      if (current?.kind === "pdf") URL.revokeObjectURL(current.url);
      return null;
    });
  }, []);

  return (
    <>
      <Button type="button" variant="secondary" onClick={handleOpen} disabled={loading}>
        <Eye className="h-4 w-4" />
        {loading ? "Loading..." : "Preview"}
      </Button>
      <FilePreviewModal
        preview={preview}
        filename={filename}
        fileId={fileId}
        open={open}
        onClose={handleClose}
      />
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
    </>
  );
}
