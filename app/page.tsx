import { Archive, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/shell/site-header";

const features = [
  {
    icon: LockKeyhole,
    title: "Protected downloads",
    body: "Files are served through app routes that check membership before touching storage.",
  },
  {
    icon: ShieldCheck,
    title: "RLS-first access",
    body: "Access groups live in Postgres so application code and database policies share one model.",
  },
  {
    icon: Archive,
    title: "Focused admin",
    body: "A small archive CMS for files, members, and permissions instead of a generic dashboard kit.",
  },
];

export default function Home() {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl items-center gap-12 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-teal-700">
            Next.js + Supabase
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight text-slate-950 md:text-6xl">
            Private document archives without the CMS baggage.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
            A production-informed starter for member-only archives, protected
            file downloads, access groups, and lightweight admin workflows.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild href="/login">
              Open demo
            </Button>
            <Button asChild href="/dashboard" variant="secondary">
              View archive
            </Button>
          </div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
          <div className="rounded-md bg-slate-950 p-5 text-sm text-slate-100">
            <p className="text-teal-300">security model</p>
            <pre className="mt-4 overflow-x-auto leading-7">
{`member -> access_groups
file   -> access_groups
route  -> verifies membership
storage -> never exposed publicly`}
            </pre>
          </div>
          <div className="mt-4 grid gap-3">
            {features.map((feature) => (
              <div key={feature.title} className="flex gap-3 rounded-md border border-slate-200 p-4">
                <feature.icon className="mt-1 h-5 w-5 shrink-0 text-teal-700" />
                <div>
                  <h2 className="font-semibold text-slate-950">{feature.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{feature.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
