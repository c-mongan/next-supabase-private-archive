import Link from "next/link";
import { notFound } from "next/navigation";
import { FileReplacementUpload } from "@/components/admin/file-replacement-upload";
import { SiteHeader } from "@/components/shell/site-header";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminFilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: file } = await supabase
    .from("archive_files")
    .select("id,title,filename,mime_type,size_bytes,sha256,storage_path,status")
    .eq("id", id)
    .maybeSingle();

  if (!file) notFound();

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-6 py-10">
        <Link className="text-sm font-semibold text-teal-700" href="/admin/files">
          Back to files
        </Link>
        <h1 className="mt-5 text-3xl font-semibold text-slate-950">{file.title}</h1>
        <dl className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <div>
            <dt className="font-semibold text-slate-700">Filename</dt>
            <dd className="mt-1 text-slate-600">{file.filename}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">Storage path</dt>
            <dd className="mt-1 break-all text-slate-600">{file.storage_path}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">MIME type</dt>
            <dd className="mt-1 text-slate-600">{file.mime_type ?? "Unknown"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-700">SHA-256</dt>
            <dd className="mt-1 break-all text-slate-600">{file.sha256 ?? "Not captured"}</dd>
          </div>
        </dl>
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-950">Replace file binary</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Uploads use a short-lived signed Storage URL, then the server verifies
            the object before updating archive metadata.
          </p>
          <div className="mt-4">
            <FileReplacementUpload fileId={file.id} />
          </div>
        </div>
      </section>
    </main>
  );
}
