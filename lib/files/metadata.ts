const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  zip: "application/zip",
  txt: "text/plain",
  html: "text/html",
  htm: "text/html",
  csv: "text/csv",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
};

export function extensionFor(filename: string): string | null {
  const match = filename.toLowerCase().match(/\.([a-z0-9]{1,12})$/);
  return match?.[1] ?? null;
}

export function mimeFor(filename: string, contentType?: string): string {
  if (contentType?.includes("/")) return contentType;
  const extension = extensionFor(filename);
  return extension
    ? (MIME_BY_EXTENSION[extension] ?? "application/octet-stream")
    : "application/octet-stream";
}

export function safeStorageFilename(filename: string): string {
  const cleaned = filename
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "_")
    .replace(/\s+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 180);
  return cleaned || "replacement.bin";
}
