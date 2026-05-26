import Link from "next/link";
import { notFound } from "next/navigation";
import { FilePreviewButton } from "@/components/files/file-preview-button";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/shell/site-header";
import { requireUser } from "@/lib/auth/guards";

export default async function FilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data: file } = await supabase
    .from("visible_archive_files")
    .select("id,title,description,filename,mime_type,collection_name,published_at")
    .eq("id", id)
    .single();

  if (!file) {
    notFound();
  }

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-6 py-10">
        <Link className="text-sm font-semibold text-teal-700" href="/dashboard">
          Back to archive
        </Link>
        <h1 className="mt-5 text-3xl font-semibold text-slate-950">{file.title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {file.collection_name ?? "Archive"} · {file.filename}
        </p>
        {file.description ? (
          <p className="mt-3 leading-7 text-slate-700">{file.description}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <FilePreviewButton fileId={file.id} filename={file.filename} />
          <Button asChild href={`/api/downloads/${file.id}`}>
            Download file
          </Button>
        </div>
      </section>
    </main>
  );
}
