import Link from "next/link";
import { FileText } from "lucide-react";
import { SearchForm } from "@/components/archive/search-form";
import { SiteHeader } from "@/components/shell/site-header";
import { requireUser } from "@/lib/auth/guards";
import { runArchiveSearch } from "@/lib/search/query";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const { supabase } = await requireUser();
  const results = await runArchiveSearch(supabase, q);

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-semibold text-slate-950">Search</h1>
        <p className="mt-2 text-slate-600">
          Search the documents available to your membership.
        </p>
        <div className="mt-6">
          <SearchForm />
        </div>
        {q ? (
          <div className="mt-8 grid gap-3">
            {results.files.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
                No matching files found.
              </div>
            ) : null}
            {results.files.map((file) => (
              <Link
                className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-600"
                href={`/files/${file.id}`}
                key={file.id}
              >
                <FileText className="mt-1 h-5 w-5 shrink-0 text-teal-700" />
                <span>
                  <span className="block font-semibold text-slate-950">
                    {file.title}
                  </span>
                  <span className="mt-1 block text-sm text-slate-500">
                    {file.collection_name ?? "Archive"} · {file.filename}
                  </span>
                  {file.excerpt ?? file.description ? (
                    <span className="mt-2 block text-sm leading-6 text-slate-600">
                      {file.excerpt ?? file.description}
                    </span>
                  ) : null}
                </span>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
