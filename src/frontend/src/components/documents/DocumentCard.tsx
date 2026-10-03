import type { DocumentView } from "@/backend";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useDeleteDocument, useRenameDocument } from "@/hooks/useDocuments";
import { formatBytes, formatRelativeTime } from "@/lib/backend";
import { fileTypeBadge, fileTypeLabel } from "@/lib/documents";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DocumentCardProps {
  document: DocumentView;
  index: number;
}

function StatusBadge({ status }: { status: DocumentView["status"] }) {
  if (status.__kind__ === "ready") {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-wider text-primary">
        <CheckCircle2 className="size-3" />
        Ready
      </span>
    );
  }
  if (status.__kind__ === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-wider text-destructive">
        <AlertCircle className="size-3" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
      <Loader2 className="size-3 animate-spin" />
      {status.__kind__ === "processing" ? "Processing" : "Pending"}
    </span>
  );
}

export function DocumentCard({ document, index }: DocumentCardProps) {
  const renameDocument = useRenameDocument();
  const deleteDocument = useDeleteDocument();

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draftName, setDraftName] = useState(document.name);

  const openRename = () => {
    setDraftName(document.name);
    setRenameOpen(true);
  };

  const submitRename = () => {
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
    deleteDocument.mutate(document.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        toast.success("Document deleted");
      },
      onError: () => toast.error("Could not delete the document"),
    });
  };

  return (
    <div
      data-ocid={`documents.item.${index + 1}`}
      className="group relative flex flex-col border border-border bg-card transition-colors hover:border-muted-foreground/40"
    >
      <Link
        to="/documents/$id"
        params={{ id: document.id.toString() }}
        data-ocid={`documents.open_link.${index + 1}`}
        className="flex min-w-0 flex-1 flex-col gap-4 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center border border-border bg-muted text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary">
            <FileText className="size-5" />
          </span>
          <Badge
            variant="secondary"
            className="rounded-none font-mono text-[0.625rem] uppercase tracking-wider"
          >
            {fileTypeBadge(document.fileType)}
          </Badge>
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-bold tracking-tight text-foreground">
            {document.name}
          </h3>
          <p className="mt-1 font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
            {fileTypeLabel(document.fileType)} ·{" "}
            {formatBytes(document.sizeBytes)}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
          <StatusBadge status={document.status} />
          <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
            {formatRelativeTime(document.uploadedAt)}
          </span>
        </div>
      </Link>

      <div className="absolute right-2 top-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Actions for ${document.name}`}
              data-ocid={`documents.menu_button.${index + 1}`}
              className="size-8 rounded-none text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-none">
            <DropdownMenuItem
              data-ocid={`documents.rename_button.${index + 1}`}
              onSelect={openRename}
            >
              <Pencil className="size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              data-ocid={`documents.delete_button.${index + 1}`}
              onSelect={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent
          data-ocid="documents.rename_dialog"
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
            data-ocid="documents.rename_input"
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
              data-ocid="documents.rename_cancel_button"
              onClick={() => setRenameOpen(false)}
              className="rounded-none border-border"
            >
              Cancel
            </Button>
            <Button
              type="button"
              data-ocid="documents.rename_save_button"
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
          data-ocid="documents.delete_dialog"
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
              data-ocid="documents.delete_cancel_button"
              onClick={() => setDeleteOpen(false)}
              className="rounded-none border-border"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              data-ocid="documents.delete_confirm_button"
              onClick={confirmDelete}
              disabled={deleteDocument.isPending}
              className={cn(
                "rounded-none font-display text-xs font-bold uppercase tracking-wider",
              )}
            >
              {deleteDocument.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
