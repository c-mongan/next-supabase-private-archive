import { SiteHeader } from "@/components/shell/site-header";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminFilesPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("archive_files")
    .select("id,title,status,storage_path")
    .order("created_at", { ascending: false });
  const files = data ?? [];

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-semibold text-slate-950">Files</h1>
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {files.map((file) => (
            <div className="grid gap-2 border-b border-slate-200 p-4 last:border-b-0 md:grid-cols-[1fr_120px]" key={file.id}>
              <div>
                <p className="font-semibold text-slate-950">{file.title}</p>
                <p className="mt-1 text-sm text-slate-500">{file.storage_path}</p>
              </div>
              <p className="text-sm font-semibold text-slate-600">{file.status}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
