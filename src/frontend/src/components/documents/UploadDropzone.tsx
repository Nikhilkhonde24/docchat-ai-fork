import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import {
  useCreateDocument,
  useSetExtractedText,
  useSetProcessingFailed,
} from "@/hooks/useDocuments";
import {
  ACCEPT_ATTRIBUTE,
  extractDocumentText,
  hashFileBytes,
  resolveFileType,
} from "@/lib/documents";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

type UploadState = "queued" | "uploading" | "done" | "error";

interface UploadItem {
  id: string;
  name: string;
  progress: number;
  state: UploadState;
  message?: string;
}

const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function UploadDropzone() {
  const { isAuthenticated, isInitializing, isLoggingIn, login } = useAuth();
  const createDocument = useCreateDocument();
  const setExtractedText = useSetExtractedText();
  const setProcessingFailed = useSetProcessingFailed();

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);

  const updateItem = (id: string, patch: Partial<UploadItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const processFile = async (file: File, id: string) => {
    const fileType = resolveFileType(file);
    if (!fileType) {
      updateItem(id, {
        state: "error",
        progress: 100,
        message: "Unsupported file type",
      });
      toast.error(`${file.name} is not a supported file type`);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      updateItem(id, {
        state: "error",
        progress: 100,
        message: "File exceeds the 25 MB limit",
      });
      toast.error(`${file.name} exceeds the 25 MB limit`);
      return;
    }

    try {
      updateItem(id, { state: "uploading", progress: 15 });
      const bytes = new Uint8Array(await file.arrayBuffer());
      updateItem(id, { progress: 45 });

      const storageRef = await hashFileBytes(bytes);
      updateItem(id, { progress: 70 });

      const documentId = await createDocument.mutateAsync({
        name: file.name,
        fileType,
        sizeBytes: BigInt(file.size),
        storageRef,
      });
      updateItem(id, { progress: 85 });

      try {
        const text = await extractDocumentText(file, fileType);
        if (text.length > 0) {
          await setExtractedText.mutateAsync({ id: documentId, text });
        } else {
          await setProcessingFailed.mutateAsync({
            id: documentId,
            reason: "No extractable text was found in this file.",
          });
        }
      } catch {
        await setProcessingFailed.mutateAsync({
          id: documentId,
          reason: "Text extraction failed for this file.",
        });
      }

      updateItem(id, { state: "done", progress: 100, message: "Ready" });
      toast.success(`${file.name} uploaded`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Upload failed. Try again.";
      updateItem(id, { state: "error", progress: 100, message });
      toast.error(`Could not upload ${file.name}`);
    }
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const queued: UploadItem[] = files.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      name: file.name,
      progress: 0,
      state: "queued",
    }));
    setItems((current) => [...queued, ...current]);
    for (const [index, file] of files.entries()) {
      void processFile(file, queued[index].id);
    }
  };

  const openPicker = () => inputRef.current?.click();

  if (!isAuthenticated) {
    return (
      <div
        data-ocid="documents.upload_signed_out"
        className="flex flex-col items-start gap-4 border border-dashed border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <p className="font-display text-base font-bold uppercase tracking-tight text-foreground">
            Sign in to upload
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your documents are private to your account. Sign in to add PDF, TXT,
            or Markdown files.
          </p>
        </div>
        <Button
          type="button"
          data-ocid="documents.upload_signin_button"
          onClick={login}
          disabled={isInitializing || isLoggingIn}
          className="shrink-0 rounded-none font-display text-sm font-bold uppercase tracking-wider"
        >
          {isLoggingIn ? "Signing in…" : "Sign in"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        data-ocid="documents.dropzone"
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-3 border border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border bg-card hover:border-muted-foreground/50",
        )}
      >
        <span
          className={cn(
            "flex size-11 items-center justify-center border",
            dragging
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-muted text-muted-foreground",
          )}
        >
          <UploadCloud className="size-5" />
        </span>
        <div>
          <p className="font-display text-base font-bold uppercase tracking-tight text-foreground">
            Drop files to upload
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            PDF, TXT, or Markdown · up to 25 MB each
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          data-ocid="documents.upload_button"
          onClick={openPicker}
          className="rounded-none border-border font-display text-xs font-bold uppercase tracking-wider"
        >
          Choose files
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTRIBUTE}
          data-ocid="documents.file_input"
          className="sr-only"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {items.length > 0 ? (
        <ul data-ocid="documents.upload_list" className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 border border-border bg-card px-3 py-2.5"
            >
              <span className="shrink-0">
                {item.state === "done" ? (
                  <CheckCircle2 className="size-4 text-primary" />
                ) : item.state === "error" ? (
                  <AlertCircle className="size-4 text-destructive" />
                ) : (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-foreground">
                    {item.name}
                  </span>
                  <span className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
                    {item.state === "error"
                      ? "failed"
                      : item.state === "done"
                        ? "ready"
                        : `${item.progress}%`}
                  </span>
                </div>
                {item.state === "uploading" || item.state === "queued" ? (
                  <Progress
                    value={item.progress}
                    className="mt-2 h-1 rounded-none bg-muted"
                  />
                ) : item.message ? (
                  <p
                    className={cn(
                      "mt-1 truncate text-xs",
                      item.state === "error"
                        ? "text-destructive"
                        : "text-muted-foreground",
                    )}
                  >
                    {item.message}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
