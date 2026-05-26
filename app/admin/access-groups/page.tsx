import { SiteHeader } from "@/components/shell/site-header";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminAccessGroupsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("access_groups")
    .select("id,name,description")
    .order("name");
  const groups = data ?? [];

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-semibold text-slate-950">Access Groups</h1>
        <div className="mt-6 grid gap-3">
          {groups.map((group) => (
            <div className="rounded-lg border border-slate-200 bg-white p-4" key={group.id}>
              <p className="font-semibold text-slate-950">{group.name}</p>
              {group.description ? (
                <p className="mt-1 text-sm text-slate-600">{group.description}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
