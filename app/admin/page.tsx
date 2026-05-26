import Link from "next/link";
import { FileText, Shield, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/shell/site-header";
import { requireAdmin } from "@/lib/auth/guards";

const adminLinks = [
  { href: "/admin/files", label: "Files", icon: FileText },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/access-groups", label: "Access groups", icon: Shield },
];

export default async function AdminPage() {
  await requireAdmin();

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-semibold text-slate-950">Admin</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {adminLinks.map((item) => (
            <Link href={item.href} key={item.href}>
              <Card className="transition hover:border-teal-600">
                <item.icon className="h-6 w-6 text-teal-700" />
                <h2 className="mt-4 font-semibold text-slate-950">{item.label}</h2>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
