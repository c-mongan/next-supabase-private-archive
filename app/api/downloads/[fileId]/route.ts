import { NextResponse } from "next/server";
import { canDownloadFile } from "@/lib/access/files";
import { createSignedDownloadUrl } from "@/lib/storage/downloads";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const allowed = await canDownloadFile(supabase, fileId);

  if (!allowed) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const { data: file } = await supabase
    .from("archive_files")
    .select("storage_path")
    .eq("id", fileId)
    .single();

  if (!file?.storage_path) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const signedUrl = await createSignedDownloadUrl(file.storage_path);
  return NextResponse.redirect(signedUrl);
}
