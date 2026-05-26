export type PreviewableFile = {
  filename: string | null;
  extension: string | null;
  mime_type: string | null;
};

const OFFICE_EXTENSIONS = new Set([
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
]);

const OFFICE_MIME_EXTENSIONS: Record<string, string> = {
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};

export function extensionFor(file: PreviewableFile): string {
  const explicit = file.extension?.toLowerCase().replace(/^\./, "");
  if (explicit) return explicit;

  const mimeExtension = file.mime_type
    ? OFFICE_MIME_EXTENSIONS[file.mime_type.toLowerCase()]
    : null;
  if (mimeExtension) return mimeExtension;

  const match = file.filename?.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

export function isOfficePreviewable(file: PreviewableFile): boolean {
  return OFFICE_EXTENSIONS.has(extensionFor(file));
}

export function isPdfPreviewable(file: PreviewableFile): boolean {
  return (
    extensionFor(file) === "pdf" ||
    file.mime_type?.toLowerCase() === "application/pdf"
  );
}
