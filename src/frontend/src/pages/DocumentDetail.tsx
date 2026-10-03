import type { DocumentDetail } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  useDeleteDocument,
  useDocument,
  useRenameDocument,
} from "@/hooks/useDocuments";
import {
  formatBytes,
  formatRelativeTime,
  timestampToDate,
} from "@/lib/backend";
import { fileTypeBadge, fileTypeLabel } from "@/lib/documents";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function formatAbsolute(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "Unknown date";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusLine({ document }: { document: DocumentDetail }) {
  const status = document.status;
  if (status.__kind__ === "ready") {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-primary">
        <CheckCircle2 className="size-3.5" />
        Ready
      </span>
    );
  }
  if (status.__kind__ === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-destructive">
        <AlertCircle className="size-3.5" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
      <Loader2 className="size-3.5 animate-spin" />
      {status.__kind__ === "processing" ? "Processing" : "Pending"}
    </span>
  );
}

export function DocumentDetailPage() {
  const { id } = useParams({ from: "/layout/documents/$id" });
  const documentId = (() => {
    try {
      return BigInt(id);
    } catch {
      return null;
    }
  })();

  const { isAuthenticated, isInitializing, isLoggingIn, login } = useAuth();
  const documentQuery = useDocument(documentId);
  const renameDocument = useRenameDocument();
  const deleteDocument = useDeleteDocument();
  const navigate = useNavigate();

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draftName, setDraftName] = useState("");

  const document = documentQuery.data ?? null;

  const openRename = () => {
    if (!document) return;
    setDraftName(document.name);
    setRenameOpen(true);
  };

  const submitRename = () => {
    if (!document) return;
    const nextName = draftName.trim();
    if (!nextName || nextName === document.name) {
      setRenameOpen(false);
      return;
    }
    renameDocument.mutate(
      { id: document.id, newName: nextName },
      {
        onSuccess: () => {
          setRenameOpen(false);
          toast.success("Document renamed");
        },
        onError: () => toast.error("Could not rename the document"),
      },
    );
  };

  const confirmDelete = () => {
    if (!document) return;
    deleteDocument.mutate(document.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        toast.success("Document deleted");
        void navigate({ to: "/documents", search: {} });
      },
      onError: () => toast.error("Could not delete the document"),
    });
  };

  if (!isAuthenticated) {
    return (
      <div
        data-ocid="document_detail.signed_out"
        className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center md:px-6"
      >
        <span className="flex size-12 items-center justify-center border border-border bg-muted text-muted-foreground">
          <FileText className="size-6" />
        </span>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-foreground">
          Sign in to view this document
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Documents are private to your account. Sign in to open this file and
          read its extracted text.
        </p>
        <Button
          type="button"
          data-ocid="document_detail.signin_button"
          onClick={login}
          disabled={isInitializing || isLoggingIn}
          className="rounded-none font-display text-sm font-bold uppercase tracking-wider"
        >
          {isLoggingIn ? "Signing in…" : "Sign in"}
        </Button>
      </div>
    );
  }

  if (documentId === null) {
    return (
      <div
        data-ocid="document_detail.error_state"
        className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center md:px-6"
      >
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-foreground">
          Document not found
        </h1>
        <Button
          asChild
          variant="outline"
          className="rounded-none border-border"
        >
          <Link to="/documents" search={{}}>
            <ArrowLeft className="size-4" />
            Back to documents
          </Link>
        </Button>
      </div>
    );
  }

  if (documentQuery.isLoading || documentQuery.isPending) {
    return (
      <div
        data-ocid="document_detail.loading_state"
        className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10 md:px-6 md:py-14"
      >
        <Skeleton className="h-8 w-40 rounded-none" />
        <Skeleton className="h-12 w-3/4 rounded-none" />
        <Skeleton className="h-64 w-full rounded-none" />
      </div>
    );
  }

  if (documentQuery.isError || !document) {
    return (
      <div
        data-ocid="document_detail.error_state"
        className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center md:px-6"
      >
        <span className="flex size-12 items-center justify-center border border-destructive/40 bg-card text-destructive">
          <AlertCircle className="size-6" />
        </span>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-foreground">
          Document not found
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          This document may have been deleted, or it does not belong to your
          account.
        </p>
        <Button
          asChild
          variant="outline"
          className="rounded-none border-border"
        >
          <Link to="/documents" search={{}}>
            <ArrowLeft className="size-4" />
            Back to documents
          </Link>
        </Button>
      </div>
    );
  }

  const extractedText = document.extractedText?.trim() ?? "";

  return (
    <div
      data-ocid="document_detail.page"
      className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6 md:py-14"
    >
      <Link
        to="/documents"
        search={{}}
        data-ocid="document_detail.back_link"
        className="inline-flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        Back to documents
      </Link>

      <header className="mt-6 flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center border border-border bg-muted text-primary">
              <FileText className="size-5" />
            </span>
            <Badge
              variant="secondary"
              className="rounded-none font-mono text-[0.625rem] uppercase tracking-wider"
            >
              {fileTypeBadge(document.fileType)}
            </Badge>
          </div>
          <h1 className="mt-4 break-words font-display text-3xl font-bold uppercase leading-tight tracking-tight text-primary md:text-4xl">
            {document.name}
          </h1>
          <div className="mt-3">
            <StatusLine document={document} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            data-ocid="document_detail.rename_button"
            onClick={openRename}
            className="rounded-none border-border font-display text-xs font-bold uppercase tracking-wider"
          >
            <Pencil className="size-3.5" />
            Rename
          </Button>
          <Button
            type="button"
            variant="outline"
            data-ocid="document_detail.delete_button"
            onClick={() => setDeleteOpen(true)}
            className="rounded-none border-border font-display text-xs font-bold uppercase tracking-wider text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      </header>

      <dl
        data-ocid="document_detail.metadata"
        className="mt-8 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4"
      >
        {[
          { label: "Type", value: fileTypeLabel(document.fileType) },
          { label: "Size", value: formatBytes(document.sizeBytes) },
          { label: "Uploaded", value: formatRelativeTime(document.uploadedAt) },
          { label: "Reference", value: document.storageRef.slice(0, 12) },
        ].map((item) => (
          <div key={item.label} className="bg-card px-4 py-3">
            <dt className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-muted-foreground">
              {item.label}
            </dt>
            <dd className="mt-1 truncate font-mono text-sm text-foreground">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
        Uploaded {formatAbsolute(document.uploadedAt)}
      </p>

      <section aria-label="Extracted text" className="mt-10">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight text-foreground">
            Extracted text
          </h2>
          {extractedText ? (
            <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
              {extractedText.length.toLocaleString()} chars
            </span>
          ) : null}
        </div>

        {extractedText ? (
          <div
            data-ocid="document_detail.text_preview"
            className="mt-4 max-h-[32rem] overflow-y-auto border border-border bg-card p-5"
          >
            <pre className="whitespace-pre-wrap break-words font-body text-sm leading-relaxed text-foreground/90">
              {extractedText}
            </pre>
          </div>
        ) : document.status.__kind__ === "failed" ? (
          <div
            data-ocid="document_detail.text_failed"
            className="mt-4 flex items-start gap-3 border border-destructive/40 bg-card p-5"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Text extraction failed
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {document.status.failed}
              </p>
            </div>
          </div>
        ) : (
          <div
            data-ocid="document_detail.text_pending"
            className="mt-4 flex items-start gap-3 border border-border bg-card p-5"
          >
            <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Extraction in progress
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                The extracted text will appear here once processing completes.
              </p>
            </div>
          </div>
        )}
      </section>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent
          data-ocid="document_detail.rename_dialog"
          className="rounded-none"
        >
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-tight">
              Rename document
            </DialogTitle>
            <DialogDescription>
              Give this document a name that is easy to find later.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={draftName}
            data-ocid="document_detail.rename_input"
            onChange={(event) => setDraftName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitRename();
            }}
            className="rounded-none"
            aria-label="Document name"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-ocid="document_detail.rename_cancel_button"
              onClick={() => setRenameOpen(false)}
              className="rounded-none border-border"
            >
              Cancel
            </Button>
            <Button
              type="button"
              data-ocid="document_detail.rename_save_button"
              onClick={submitRename}
              disabled={
                renameDocument.isPending || draftName.trim().length === 0
              }
              className="rounded-none font-display text-xs font-bold uppercase tracking-wider"
            >
              {renameDocument.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent
          data-ocid="document_detail.delete_dialog"
          className="rounded-none"
        >
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-tight">
              Delete document
            </DialogTitle>
            <DialogDescription>
              “{document.name}” and its extracted text will be permanently
              removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-ocid="document_detail.delete_cancel_button"
              onClick={() => setDeleteOpen(false)}
              className="rounded-none border-border"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              data-ocid="document_detail.delete_confirm_button"
              onClick={confirmDelete}
              disabled={deleteDocument.isPending}
              className="rounded-none font-display text-xs font-bold uppercase tracking-wider"
            >
              {deleteDocument.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
