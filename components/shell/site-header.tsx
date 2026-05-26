import Link from "next/link";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--border)] bg-white/85">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-950">
          <Archive className="h-5 w-5 text-teal-700" />
          Private Archive
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" href="/dashboard">
            Archive
          </Button>
          <Button asChild variant="ghost" href="/search">
            Search
          </Button>
          <Button asChild variant="ghost" href="/admin">
            Admin
          </Button>
          <Button asChild href="/login">
            Sign in
          </Button>
        </nav>
      </div>
    </header>
  );
}
