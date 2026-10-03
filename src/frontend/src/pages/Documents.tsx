import { FileType } from "@/backend";
import { DocumentCard } from "@/components/documents/DocumentCard";
import {
  DocumentFilters,
  type FileTypeFilter,
} from "@/components/documents/DocumentFilters";
import { UploadDropzone } from "@/components/documents/UploadDropzone";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useDocuments } from "@/hooks/useDocuments";
import {
  Link,
  Outlet,
  useMatchRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { FileText, UploadCloud } from "lucide-react";

const SKELETON_IDS = Array.from({ length: 6 }, (_, i) => `doc-skeleton-${i}`);

function parseFileType(value: string | undefined): FileTypeFilter {
  if (
    value === FileType.pdf ||
    value === FileType.txt ||
    value === FileType.markdown
  ) {
    return value;
  }
  return "all";
}

export function DocumentsPage() {
  const { isAuthenticated, isInitializing } = useAuth();
  const search = useSearch({ from: "/layout/documents" });
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();

  const isDetailRoute = Boolean(
    matchRoute({ to: "/documents/$id", fuzzy: false }),
  );

  const nameContains = search.q ?? "";
  const fileType = parseFileType(search.type);

  const documentsQuery = useDocuments(
    {
      nameContains: nameContains.trim() || undefined,
      fileType: fileType === "all" ? undefined : fileType,
    },
    isAuthenticated,
  );

  const documents = documentsQuery.data ?? [];
  const showSkeleton =
    isAuthenticated && (documentsQuery.isLoading || documentsQuery.isPending);

  const setSearch = (value: string) => {
    void navigate({
      to: "/documents",
      search: (prev) => ({ ...prev, q: value || undefined }),
      replace: true,
    });
  };

  const setFileType = (value: FileTypeFilter) => {
    void navigate({
      to: "/documents",
      search: (prev) => ({
        ...prev,
        type: value === "all" ? undefined : value,
      }),
      replace: true,
    });
  };

  const hasFilters = nameContains.trim().length > 0 || fileType !== "all";

  if (isDetailRoute) {
    return <Outlet />;
  }

  return (
    <div
      data-ocid="documents.page"
      className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-14"
    >
      <header className="mb-8 flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-muted-foreground">
            Library
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold uppercase leading-none tracking-tight text-primary md:text-5xl">
            Documents
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            Upload PDF, TXT, and Markdown files, then open any document to read
            its extracted text.
          </p>
        </div>
        {isAuthenticated ? (
          <Button
            asChild
            variant="outline"
            data-ocid="documents.chat_link"
            className="shrink-0 rounded-none border-border font-display text-xs font-bold uppercase tracking-wider"
          >
            <Link to="/chat">
              <FileText className="size-4" />
              Go to chat
            </Link>
          </Button>
        ) : null}
      </header>

      <section aria-label="Upload documents" className="mb-8">
        <UploadDropzone />
      </section>

      {isAuthenticated ? (
        <>
          <section aria-label="Filter documents" className="mb-6">
            <DocumentFilters
              search={nameContains}
              onSearchChange={setSearch}
              fileType={fileType}
              onFileTypeChange={setFileType}
              resultCount={documents.length}
            />
          </section>

          {showSkeleton ? (
            <div
              data-ocid="documents.loading_state"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {SKELETON_IDS.map((id) => (
                <Skeleton key={id} className="h-44 rounded-none" />
              ))}
            </div>
          ) : documentsQuery.isError ? (
            <div
              data-ocid="documents.error_state"
              className="flex flex-col items-center gap-3 border border-destructive/40 bg-card px-6 py-14 text-center"
            >
              <p className="font-display text-lg font-bold uppercase tracking-tight text-foreground">
                Could not load documents
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                Something went wrong while fetching your library. Try again.
              </p>
              <Button
                type="button"
                variant="outline"
                data-ocid="documents.retry_button"
                onClick={() => void documentsQuery.refetch()}
                className="rounded-none border-border"
              >
                Retry
              </Button>
            </div>
          ) : documents.length === 0 ? (
            <div
              data-ocid="documents.empty_state"
              className="flex flex-col items-center gap-4 border border-dashed border-border bg-card px-6 py-16 text-center"
            >
              <span className="flex size-12 items-center justify-center border border-border bg-muted text-muted-foreground">
                {hasFilters ? (
                  <FileText className="size-6" />
                ) : (
                  <UploadCloud className="size-6" />
                )}
              </span>
              <div>
                <p className="font-display text-xl font-bold uppercase tracking-tight text-foreground">
                  {hasFilters ? "No matching documents" : "No documents yet"}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  {hasFilters
                    ? "Try a different search term or clear the file-type filter."
                    : "Upload your first PDF, TXT, or Markdown file to start building your library."}
                </p>
              </div>
              {hasFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="documents.empty_clear_button"
                  onClick={() => {
                    setSearch("");
                    setFileType("all");
                  }}
                  className="rounded-none border-border"
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : (
            <div
              data-ocid="documents.grid"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {documents.map((document, index) => (
                <DocumentCard
                  key={document.id.toString()}
                  document={document}
                  index={index}
                />
              ))}
            </div>
          )}
        </>
      ) : isInitializing ? (
        <div
          data-ocid="documents.loading_state"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {SKELETON_IDS.map((id) => (
            <Skeleton key={id} className="h-44 rounded-none" />
          ))}
        </div>
      ) : null}
    </div>
  );
}
