import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { OfficeParser, type SupportedFileType } from "officeparser";
import {
  extensionFor,
  isOfficePreviewable,
  type PreviewableFile,
} from "@/lib/preview/office-types";

const execFileAsync = promisify(execFile);

const MAX_LIBREOFFICE_BYTES = 100 * 1024 * 1024;
const MAX_PARSER_BYTES = 25 * 1024 * 1024;
const MAX_HTML_CHARS = 1_500_000;
const MAX_TEXT_CHARS = 250_000;
const LIBREOFFICE_TIMEOUT_MS = 20_000;

const MODERN_OFFICE_TYPES: Record<string, SupportedFileType> = {
  docx: "docx",
  xlsx: "xlsx",
  pptx: "pptx",
};

export type OfficePreviewJson =
  | {
      kind: "html";
      html: string;
      source: "officeparser";
      truncated: boolean;
    }
  | {
      kind: "text";
      text: string;
      source: "officeparser";
      truncated: boolean;
    }
  | {
      kind: "unavailable";
      reason: string;
    };

export type OfficePreviewResult =
  | { kind: "pdf"; bytes: Buffer; source: "libreoffice" }
  | OfficePreviewJson;

function cleanPreviewFilename(filename: string | null, extension: string): string {
  const fallback = `document.${extension}`;
  const cleaned = (filename || fallback).replace(/[^a-zA-Z0-9._ -]/g, "_");
  return cleaned.toLowerCase().endsWith(`.${extension}`)
    ? cleaned
    : `${cleaned}.${extension}`;
}

async function convertWithLibreOffice(
  bytes: Uint8Array,
  file: PreviewableFile,
  extension: string,
): Promise<Buffer | null> {
  if (bytes.byteLength > MAX_LIBREOFFICE_BYTES) return null;

  const candidates = [
    process.env.SOFFICE_BIN,
    "soffice",
    "libreoffice",
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    "/opt/homebrew/bin/soffice",
    "/usr/local/bin/soffice",
    "/usr/bin/libreoffice",
  ].filter(Boolean) as string[];

  for (const binary of candidates) {
    const dir = await mkdtemp(path.join(tmpdir(), "archive-preview-"));
    try {
      const inputName = cleanPreviewFilename(file.filename, extension);
      const inputPath = path.join(dir, inputName);
      await writeFile(inputPath, Buffer.from(bytes));

      await execFileAsync(
        binary,
        ["--headless", "--convert-to", "pdf", "--outdir", dir, inputPath],
        { timeout: LIBREOFFICE_TIMEOUT_MS },
      );

      const outputPath = path.join(
        dir,
        `${path.basename(inputName, path.extname(inputName))}.pdf`,
      );
      return await readFile(outputPath);
    } catch {
      // Most local and hosted starter deployments will not have LibreOffice.
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  return null;
}

async function parseModernOffice(
  bytes: Uint8Array,
  fileType: SupportedFileType,
): Promise<OfficePreviewJson> {
  if (bytes.byteLength > MAX_PARSER_BYTES) {
    return {
      kind: "unavailable",
      reason: "This file is too large for the lightweight in-app Office preview.",
    };
  }

  const ast = await OfficeParser.parseOffice(Buffer.from(bytes), {
    fileType,
    ocr: false,
    extractAttachments: false,
    includeRawContent: false,
    newlineDelimiter: "\n",
  });

  const html = await ast.to("html", {
    includeImages: false,
    includeCharts: false,
    renderMetadata: false,
    htmlConfig: { standalone: true },
  });
  const htmlValue = String(html.value ?? "");
  if (htmlValue && htmlValue.length <= MAX_HTML_CHARS) {
    return {
      kind: "html",
      html: htmlValue,
      source: "officeparser",
      truncated: false,
    };
  }

  const text = await ast.to("text");
  const textValue = String(text.value ?? "").trim();
  const truncated = textValue.length > MAX_TEXT_CHARS;
  return {
    kind: "text",
    text: truncated ? textValue.slice(0, MAX_TEXT_CHARS) : textValue,
    source: "officeparser",
    truncated,
  };
}

export async function buildOfficePreview(
  bytes: Uint8Array,
  file: PreviewableFile,
): Promise<OfficePreviewResult> {
  const extension = extensionFor(file);
  if (!isOfficePreviewable(file)) {
    return { kind: "unavailable", reason: "This file type is not an Office file." };
  }

  const converted = await convertWithLibreOffice(bytes, file, extension);
  if (converted) {
    return { kind: "pdf", bytes: converted, source: "libreoffice" };
  }

  const parserType = MODERN_OFFICE_TYPES[extension];
  if (parserType) {
    try {
      return await parseModernOffice(bytes, parserType);
    } catch {
      return {
        kind: "unavailable",
        reason: "The in-app preview could not read this Office file.",
      };
    }
  }

  return {
    kind: "unavailable",
    reason:
      "Legacy Office previews need LibreOffice on the server. Download is still available.",
  };
}
