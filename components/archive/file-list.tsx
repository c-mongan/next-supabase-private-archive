import Link from "next/link";
import { Download, FileText } from "lucide-react";

export type ArchiveFile = {
  id: string;
  title: string;
  description: string | null;
  published_at: string | null;
};

export function FileList({ files }: { files: ArchiveFile[] }) {
  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
        No files are available for your access groups yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {files.map((file) => (
        <Link
          className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-600"
          href={`/files/${file.id}`}
          key={file.id}
        >
          <span className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-teal-700" />
            <span>
              <span className="block font-semibold text-slate-950">{file.title}</span>
              {file.description ? (
                <span className="mt-1 block text-sm text-slate-600">{file.description}</span>
              ) : null}
            </span>
          </span>
          <Download className="h-5 w-5 shrink-0 text-slate-500" />
        </Link>
      ))}
    </div>
  );
}
