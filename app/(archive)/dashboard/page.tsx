import { FileList } from "@/components/archive/file-list";
import { SiteHeader } from "@/components/shell/site-header";
import { requireUser } from "@/lib/auth/guards";

export default async function DashboardPage() {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("visible_archive_files")
    .select("id,title,description,published_at")
    .order("published_at", { ascending: false });
  const files = data ?? [];

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-semibold text-slate-950">Archive</h1>
        <p className="mt-2 text-slate-600">
          Browse documents available to your membership.
        </p>
        <div className="mt-8">
          <FileList files={files} />
        </div>
      </section>
    </main>
  );
}
