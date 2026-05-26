"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { extensionFor, mimeFor, safeStorageFilename } from "@/lib/files/metadata";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const uploadTargetSchema = z.object({
  fileId: z.string().uuid(),
  filename: z.string().trim().min(1).max(260),
  contentType: z.string().trim().max(200).optional(),
  sizeBytes: z.number().int().positive().safe(),
});

const finalizeReplacementSchema = uploadTargetSchema.extend({
  storagePath: z.string().trim().min(1).max(1000),
  sha256: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{64}$/)
    .nullable()
    .optional(),
});

export async function createFileReplacementUploadTarget(input: {
  fileId: string;
  filename: string;
  contentType?: string;
  sizeBytes: number;
}): Promise<{
  bucket: string;
  storagePath: string;
  token: string;
}> {
  await requireAdmin();
  const parsed = uploadTargetSchema.parse(input);

  const supabase = await createClient();
  const { data: file, error: fileError } = await supabase
    .from("archive_files")
    .select("id")
    .eq("id", parsed.fileId)
    .maybeSingle();
  if (fileError) throw new Error(fileError.message);
  if (!file) throw new Error("file_not_found");

  const storagePath = [
    "replacements",
    parsed.fileId,
    `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID()}-${safeStorageFilename(parsed.filename)}`,
  ].join("/");

  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "archive-files";
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUploadUrl(storagePath);
  if (error || !data?.token) {
    throw new Error(error?.message ?? "signed_upload_failed");
  }

  return {
    bucket,
    storagePath,
    token: data.token,
  };
}

export async function finalizeFileReplacement(input: {
  fileId: string;
  filename: string;
  contentType?: string;
  sizeBytes: number;
  storagePath: string;
  sha256?: string | null;
}): Promise<void> {
  const { user } = await requireAdmin();
  const parsed = finalizeReplacementSchema.parse(input);
  const expectedPrefix = `replacements/${parsed.fileId}/`;
  if (!parsed.storagePath.startsWith(expectedPrefix)) {
    throw new Error("invalid_replacement_path");
  }

  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase
    .from("archive_files")
    .select("id,filename,storage_path,sha256,size_bytes,mime_type")
    .eq("id", parsed.fileId)
    .maybeSingle();
  if (currentError) throw new Error(currentError.message);
  if (!current) throw new Error("file_not_found");

  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "archive-files";
  const admin = createAdminClient();
  const { data: objectInfo, error: infoError } = await admin.storage
    .from(bucket)
    .info(parsed.storagePath);
  if (infoError) throw new Error(infoError.message);
  if (!objectInfo) throw new Error("replacement_binary_not_found");
  if (objectInfo.size !== parsed.sizeBytes) {
    throw new Error("replacement_size_mismatch");
  }

  const replacementMimeType = mimeFor(
    parsed.filename,
    objectInfo.contentType ?? parsed.contentType,
  );

  const { data: updated, error: updateError } = await supabase
    .from("archive_files")
    .update({
      filename: parsed.filename,
      extension: extensionFor(parsed.filename),
      mime_type: replacementMimeType,
      size_bytes: objectInfo.size,
      storage_path: parsed.storagePath,
      sha256: parsed.sha256 ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.fileId)
    .select("id")
    .maybeSingle();
  if (updateError) throw new Error(updateError.message);
  if (!updated) throw new Error("file_not_found");

  await admin.from("audit_events").insert({
    actor_id: user.id,
    action: "file_binary_replaced",
    target_type: "file",
    target_id: parsed.fileId,
    metadata: {
      old_filename: current.filename,
      old_storage_path: current.storage_path,
      old_sha256: current.sha256,
      old_size_bytes: current.size_bytes,
      old_mime_type: current.mime_type,
      new_filename: parsed.filename,
      new_storage_path: parsed.storagePath,
      new_sha256: parsed.sha256 ?? null,
      new_size_bytes: objectInfo.size,
      new_mime_type: replacementMimeType,
    },
  });

  revalidatePath("/admin/files");
  revalidatePath(`/admin/files/${parsed.fileId}`);
  revalidatePath(`/files/${parsed.fileId}`);
}
