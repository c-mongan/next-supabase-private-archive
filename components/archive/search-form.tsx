"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams);
    const trimmed = query.trim();

    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }

    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
      <label className="sr-only" htmlFor="archive-search">
        Search archive
      </label>
      <input
        id="archive-search"
        className="h-11 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-slate-950 outline-none focus:border-teal-700"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search titles, filenames, and extracted text"
      />
      <Button type="submit" disabled={pending}>
        <Search className="h-4 w-4" />
        {pending ? "Searching..." : "Search"}
      </Button>
    </form>
  );
}
