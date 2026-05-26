import type { SupabaseClient } from "@supabase/supabase-js";

export async function canDownloadFile(
  supabase: SupabaseClient,
  fileId: string,
) {
  const { data, error } = await supabase.rpc("can_download_file", {
    target_file_id: fileId,
  });

  if (error) {
    return false;
  }

  return data === true;
}
