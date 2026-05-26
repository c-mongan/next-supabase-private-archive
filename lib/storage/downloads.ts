import { createAdminClient } from "@/lib/supabase/admin";

export async function createSignedDownloadUrl(storagePath: string) {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "archive-files";
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 60);

  if (error || !data?.signedUrl) {
    throw new Error("Unable to create signed download URL.");
  }

  return data.signedUrl;
}
