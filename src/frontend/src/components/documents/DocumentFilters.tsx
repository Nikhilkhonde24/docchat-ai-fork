import { FileType } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

export type FileTypeFilter = FileType | "all";

interface DocumentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  fileType: FileTypeFilter;
  onFileTypeChange: (value: FileTypeFilter) => void;
  resultCount: number;
}

const FILE_TYPE_OPTIONS: { value: FileTypeFilter; label: string }[] = [
  { value: "all", label: "All types" },
  { value: FileType.pdf, label: "PDF" },
  { value: FileType.txt, label: "Plain text" },
  { value: FileType.markdown, label: "Markdown" },
];

export function DocumentFilters({
  search,
  onSearchChange,
  fileType,
  onFileTypeChange,
  resultCount,
}: DocumentFiltersProps) {
  const hasFilters = search.trim().length > 0 || fileType !== "all";

  return (
    <div
      data-ocid="documents.filters"
      className="flex flex-col gap-3 border border-border bg-card p-3 sm:flex-row sm:items-center"
    >
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          data-ocid="documents.search_input"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search documents by name"
          aria-label="Search documents by name"
          className="rounded-none pl-9"
        />
      </div>

      <Select
        value={fileType}
        onValueChange={(value) => onFileTypeChange(value as FileTypeFilter)}
      >
        <SelectTrigger
          data-ocid="documents.file_type_select"
          aria-label="Filter by file type"
          className="w-full rounded-none sm:w-44"
        >
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent className="rounded-none">
          {FILE_TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span
          data-ocid="documents.result_count"
          className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground"
        >
          {resultCount} {resultCount === 1 ? "doc" : "docs"}
        </span>
        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-ocid="documents.clear_filters_button"
            onClick={() => {
              onSearchChange("");
              onFileTypeChange("all");
            }}
            className="rounded-none text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
}
