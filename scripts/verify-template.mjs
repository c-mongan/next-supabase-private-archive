import { readFile } from "node:fs/promises";

const checks = [
  {
    file: "supabase/migrations/20260515000000_initial_private_archive.sql",
    mustContain: ["enable row level security", "can_download_file"],
  },
  {
    file: "supabase/migrations/20260526224426_port_search_previews_replacements.sql",
    mustContain: [
      "file_text_chunks",
      "search_vector",
      "audit_events",
      "file_text_chunks_select_visible",
    ],
  },
  {
    file: "app/api/downloads/[fileId]/route.ts",
    mustContain: ["canDownloadFile", "createSignedDownloadUrl"],
  },
  {
    file: "app/api/previews/[fileId]/route.ts",
    mustContain: ["archive_files", "Cache-Control", "private, no-store"],
  },
  {
    file: "app/admin/files/actions.ts",
    mustContain: ["createSignedUploadUrl", "upload", "file_binary_replaced"],
  },
];

for (const check of checks) {
  const source = await readFile(check.file, "utf8");
  for (const expected of check.mustContain) {
    if (!source.includes(expected)) {
      throw new Error(`${check.file} is missing ${expected}`);
    }
  }
}

console.log("Template verification passed.");
