import { NextResponse } from "next/server";
import { z } from "zod";
import { buildOfficePreview } from "@/lib/preview/office-preview";
import {
  isOfficePreviewable,
  isPdfPreviewable,
  type PreviewableFile,
} from "@/lib/preview/office-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const fileIdSchema = z.string().uuid();

export async function GET(
  _request: Request,
  context: { params: Promise<unknown> },
) {
  const { fileId } = (await context.params) as { fileId?: string };
  const parsed = fileIdSchema.safeParse(fileId);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_file_id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: file, error } = await supabase
    .from("archive_files")
    .select("id,storage_path,filename,extension,mime_type")
    .eq("id", parsed.data)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }
  if (!file?.storage_path) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const previewFile = file as PreviewableFile;
  if (!isPdfPreviewable(previewFile) && !isOfficePreviewable(previewFile)) {
    return NextResponse.json({ error: "unsupported_preview_type" }, { status: 415 });
  }

  const admin = createAdminClient();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "archive-files";
  const { data: blob, error: downloadError } = await admin.storage
    .from(bucket)
    .download(file.storage_path);
  if (downloadError || !blob) {
    return NextResponse.json({ error: "storage_download_failed" }, { status: 500 });
  }

  await admin.from("audit_events").insert({
    actor_id: user.id,
    action: "file_previewed",
    target_type: "file",
    target_id: file.id,
    metadata: {
      filename: file.filename,
      mime_type: file.mime_type,
    },
  });

  if (isPdfPreviewable(previewFile)) {
    return new NextResponse(new Uint8Array(await blob.arrayBuffer()), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${file.filename ?? "document.pdf"}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const preview = await buildOfficePreview(
    new Uint8Array(await blob.arrayBuffer()),
    previewFile,
  );
  if (preview.kind === "pdf") {
    const basename = (file.filename || "document").replace(/\.[^.]+$/, "");
    return new NextResponse(new Uint8Array(preview.bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${basename}-preview.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  return NextResponse.json(preview, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
