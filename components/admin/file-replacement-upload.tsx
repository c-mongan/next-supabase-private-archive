"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Upload, XCircle } from "lucide-react";
import {
  createFileReplacementUploadTarget,
  finalizeFileReplacement,
} from "@/app/admin/files/actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const HASH_LIMIT_BYTES = 100 * 1024 * 1024;

type UploadState =
  | { status: "idle"; message: string | null }
  | { status: "working"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function FileReplacementUpload({ fileId }: { fileId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({
    status: "idle",
    message: null,
  });
  const [pending, startTransition] = useTransition();
  const working = pending || state.status === "working";

  function submit() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setState({ status: "error", message: "Choose a file first." });
      return;
    }

    startTransition(async () => {
      try {
        setState({ status: "working", message: "Preparing upload..." });
        const target = await createFileReplacementUploadTarget({
          fileId,
          filename: file.name,
          contentType: file.type || undefined,
          sizeBytes: file.size,
        });

        setState({ status: "working", message: "Uploading..." });
        const supabase = createClient();
        const { error: uploadError } = await supabase.storage
          .from(target.bucket)
          .uploadToSignedUrl(target.storagePath, target.token, file, {
            contentType: file.type || "application/octet-stream",
          });
        if (uploadError) throw new Error(uploadError.message);

        setState({ status: "working", message: "Finalizing..." });
        const sha256 =
          file.size <= HASH_LIMIT_BYTES ? await sha256Hex(file) : null;
        await finalizeFileReplacement({
          fileId,
          filename: file.name,
          contentType: file.type || undefined,
          sizeBytes: file.size,
          storagePath: target.storagePath,
          sha256,
        });

        if (inputRef.current) inputRef.current.value = "";
        setState({ status: "success", message: "Replacement saved." });
        router.refresh();
      } catch (error) {
        setState({
          status: "error",
          message:
            error instanceof Error ? error.message : "Replacement failed.",
        });
      }
    });
  }

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          type="file"
          disabled={working}
          className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white disabled:cursor-not-allowed disabled:opacity-60"
        />
        <Button type="button" onClick={submit} disabled={working}>
          <Upload className="h-4 w-4" />
          Replace binary
        </Button>
      </div>
      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "flex items-center gap-2 text-xs font-medium text-rose-600"
              : state.status === "success"
                ? "flex items-center gap-2 text-xs font-medium text-emerald-600"
                : "text-xs font-medium text-slate-500"
          }
        >
          {state.status === "success" ? <CheckCircle2 className="h-4 w-4" /> : null}
          {state.status === "error" ? <XCircle className="h-4 w-4" /> : null}
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

async function sha256Hex(file: File): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
