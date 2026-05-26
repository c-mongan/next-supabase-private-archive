import type { SupabaseClient } from "@supabase/supabase-js";

export type SearchFileHit = {
  id: string;
  title: string;
  filename: string;
  description: string | null;
  collection_name: string | null;
  excerpt: string | null;
};

export type SearchResult = {
  files: SearchFileHit[];
};

const HARD_LIMIT = 25;
const CHUNK_SEARCH_LIMIT = 75;

type VisibleFileRow = {
  id: string;
  title: string;
  filename: string;
  description: string | null;
  collection_name: string | null;
};

type ChunkFileRow = Omit<VisibleFileRow, "collection_name">;

type ChunkRow = {
  text: string;
  file: ChunkFileRow | ChunkFileRow[] | null;
};

export async function runArchiveSearch(
  supabase: SupabaseClient,
  rawQuery: string,
  options: { collectionId?: string | null } = {},
): Promise<SearchResult> {
  const query = rawQuery.trim();
  if (!query) return { files: [] };

  const filenamePattern = `%${escapeLike(query)}%`;

  let textQuery = supabase
    .from("visible_archive_files")
    .select("id,title,filename,description,collection_name")
    .textSearch("search_vector", query, {
      type: "plain",
      config: "english",
    })
    .limit(HARD_LIMIT);

  let nameQuery = supabase
    .from("visible_archive_files")
    .select("id,title,filename,description,collection_name")
    .or(`title.ilike.${filenamePattern},filename.ilike.${filenamePattern}`)
    .limit(HARD_LIMIT);

  if (options.collectionId) {
    textQuery = textQuery.eq("collection_id", options.collectionId);
    nameQuery = nameQuery.eq("collection_id", options.collectionId);
  }

  const [textRes, nameRes, chunksRes] = await Promise.all([
    textQuery,
    nameQuery,
    supabase
      .from("file_text_chunks")
      .select(
        "text, file:archive_files(id,title,filename,description,collection_id)",
      )
      .textSearch("search_vector", query, {
        type: "plain",
        config: "english",
      })
      .limit(CHUNK_SEARCH_LIMIT),
  ]);

  const chunkRows = ((chunksRes.data ?? []) as ChunkRow[])
    .map((chunk) => {
      const file = Array.isArray(chunk.file) ? chunk.file[0] : chunk.file;
      if (!file) return null;
      return { chunk, file };
    })
    .filter(
      (row): row is { chunk: ChunkRow; file: ChunkFileRow } => row !== null,
    );

  const fileRows = [
    ...((textRes.data ?? []) as VisibleFileRow[]),
    ...((nameRes.data ?? []) as VisibleFileRow[]),
    ...chunkRows.map(({ chunk, file }) => ({
      ...file,
      collection_name: null,
      excerpt: extractExcerpt(chunk.text, query),
    })),
  ];

  return {
    files: Array.from(
      new Map(
        fileRows.map((file) => [
          file.id,
          {
            id: file.id,
            title: file.title,
            filename: file.filename,
            description: file.description,
            collection_name: file.collection_name,
            excerpt: "excerpt" in file ? String(file.excerpt ?? "") : null,
          },
        ]),
      ).values(),
    ).slice(0, HARD_LIMIT),
  };
}

function escapeLike(value: string): string {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}

function extractExcerpt(text: string | null, query: string): string | null {
  if (!text) return null;
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return null;

  const term = query.split(/\s+/)[0]?.toLowerCase();
  const index = term ? normalized.toLowerCase().indexOf(term) : -1;
  if (index === -1) return normalized.slice(0, 220);

  const start = Math.max(0, index - 80);
  const end = Math.min(normalized.length, index + 160);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < normalized.length ? "..." : "";
  return `${prefix}${normalized.slice(start, end)}${suffix}`;
}
