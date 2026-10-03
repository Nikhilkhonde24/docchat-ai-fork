import { FileType } from "@/backend";

/** Accepted upload extensions mapped to the backend's FileType enum. */
export const ACCEPTED_EXTENSIONS = [
  ".pdf",
  ".txt",
  ".md",
  ".markdown",
] as const;

export const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.join(",");

export interface FileTypeMeta {
  label: string;
  badge: string;
}

export const FILE_TYPE_META: Record<FileType, FileTypeMeta> = {
  [FileType.pdf]: { label: "PDF", badge: "PDF" },
  [FileType.txt]: { label: "Plain text", badge: "TXT" },
  [FileType.markdown]: { label: "Markdown", badge: "MD" },
};

/** Resolve a browser File to a backend FileType, or null when unsupported. */
export function resolveFileType(file: File): FileType | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return FileType.pdf;
  if (name.endsWith(".md") || name.endsWith(".markdown"))
    return FileType.markdown;
  if (name.endsWith(".txt")) return FileType.txt;
  return null;
}

/** Human-readable file type label for a stored document. */
export function fileTypeLabel(fileType: FileType): string {
  return FILE_TYPE_META[fileType]?.label ?? "Document";
}

/** Short uppercase badge token for a stored document. */
export function fileTypeBadge(fileType: FileType): string {
  return FILE_TYPE_META[fileType]?.badge ?? "DOC";
}

/** SHA-256 content reference used as the document's storage reference. */
export async function hashFileBytes(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    bytes as unknown as BufferSource,
  );
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `sha256:${hex}`;
}

/**
 * Extract plain text from a PDF using pdf.js. The worker is bundled by Vite
 * through the `?url` import so no CDN or manual worker copy is required.
 */
export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url"))
    .default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const loadingTask = pdfjs.getDocument({ data: bytes });
  const doc = await loadingTask.promise;
  try {
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) pages.push(text);
    }
    return pages.join("\n\n");
  } finally {
    await loadingTask.destroy();
  }
}

/**
 * Extract text for a supported file. Text formats are read directly; PDFs go
 * through pdf.js. Returns an empty string when nothing extractable is found.
 */
export async function extractDocumentText(
  file: File,
  fileType: FileType,
): Promise<string> {
  if (fileType === FileType.pdf) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    return extractPdfText(bytes);
  }
  return (await file.text()).trim();
}
