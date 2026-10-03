import type { Citation } from "@/backend";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

interface CitationChipProps {
  citation: Citation;
  active: boolean;
  onSelect: (citation: Citation) => void;
}

/**
 * Inline numbered citation marker. Clicking it reveals the exact source
 * passage the answer was drawn from.
 */
export function CitationChip({
  citation,
  active,
  onSelect,
}: CitationChipProps) {
  const label = Number(citation.index);

  return (
    <button
      type="button"
      data-ocid={`chat.citation_chip.${label}`}
      aria-label={`Show source ${label}: ${citation.documentName}`}
      aria-pressed={active}
      onClick={() => onSelect(citation)}
      className={cn(
        "citation-chip ml-1 align-middle transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active && "ring-2 ring-ring ring-offset-2 ring-offset-background",
      )}
    >
      {label}
    </button>
  );
}

interface CitationPassageProps {
  citation: Citation;
  onClose: () => void;
}

/** Expanded source passage revealed when a citation chip is activated. */
export function CitationPassage({ citation, onClose }: CitationPassageProps) {
  return (
    <div
      data-ocid={`chat.citation_passage.${Number(citation.index)}`}
      className="mt-3 animate-fade-in border-l-2 border-primary bg-background/60 px-3 py-2.5"
    >
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-primary">
          <FileText className="size-3 shrink-0" />
          <span className="truncate">{citation.documentName}</span>
        </span>
        <button
          type="button"
          data-ocid={`chat.citation_close_button.${Number(citation.index)}`}
          onClick={onClose}
          className="shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
        >
          Close
        </button>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
        {citation.passage}
      </p>
    </div>
  );
}
