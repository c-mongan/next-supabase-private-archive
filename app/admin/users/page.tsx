import { SiteHeader } from "@/components/shell/site-header";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminUsersPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("profiles")
    .select("id,email,role,created_at")
    .order("created_at", { ascending: false });
  const users = data ?? [];

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-semibold text-slate-950">Users</h1>
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {users.map((user) => (
            <div className="grid gap-2 border-b border-slate-200 p-4 last:border-b-0 md:grid-cols-[1fr_120px]" key={user.id}>
              <p className="font-semibold text-slate-950">{user.email}</p>
              <p className="text-sm font-semibold text-slate-600">{user.role}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
