import type { ChatSessionSummary, DocumentView } from "@/backend";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/backend";
import { cn } from "@/lib/utils";
import { FileText, MessageSquarePlus, Trash2 } from "lucide-react";

interface ChatSidebarProps {
  documents: DocumentView[];
  sessions: ChatSessionSummary[];
  selectedDocumentIds: bigint[];
  activeSessionId: bigint | null;
  isLoadingDocuments: boolean;
  isLoadingSessions: boolean;
  onToggleDocument: (id: bigint) => void;
  onSelectSession: (id: bigint) => void;
  onDeleteSession: (id: bigint) => void;
  onNewChat: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-3 pb-2 pt-4 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-muted-foreground">
      {children}
    </h2>
  );
}

/**
 * Left pane of the chat workspace: document context selection and the
 * conversation history list, with a new-chat action.
 */
export function ChatSidebar({
  documents,
  sessions,
  selectedDocumentIds,
  activeSessionId,
  isLoadingDocuments,
  isLoadingSessions,
  onToggleDocument,
  onSelectSession,
  onDeleteSession,
  onNewChat,
}: ChatSidebarProps) {
  return (
    <aside
      data-ocid="chat.sidebar"
      className="flex h-full w-full flex-col border-r border-border bg-sidebar"
    >
      <div className="border-b border-border p-3">
        <Button
          type="button"
          data-ocid="chat.new_chat_button"
          onClick={onNewChat}
          className="w-full rounded-none font-display text-xs font-bold uppercase tracking-wider"
        >
          <MessageSquarePlus className="size-4" />
          New chat
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <SectionLabel>Documents</SectionLabel>
        {isLoadingDocuments ? (
          <p
            data-ocid="chat.documents_loading_state"
            className="px-3 pb-3 font-mono text-xs text-muted-foreground"
          >
            Loading…
          </p>
        ) : documents.length === 0 ? (
          <p
            data-ocid="chat.documents_empty_state"
            className="px-3 pb-3 text-sm text-muted-foreground"
          >
            No documents yet. Upload one to use it as context.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5 px-2 pb-2">
            {documents.map((doc) => {
              const selected = selectedDocumentIds.includes(doc.id);
              const ready = doc.status.__kind__ === "ready";
              return (
                <li key={Number(doc.id)}>
                  <button
                    type="button"
                    data-ocid={`chat.document_toggle.${Number(doc.id)}`}
                    aria-pressed={selected}
                    disabled={!ready}
                    onClick={() => onToggleDocument(doc.id)}
                    className={cn(
                      "flex w-full items-center gap-2 border px-2.5 py-2 text-left text-sm transition-colors",
                      selected
                        ? "border-primary/60 bg-primary/10 text-foreground"
                        : "border-transparent text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                      !ready && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center border",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border",
                      )}
                      aria-hidden="true"
                    >
                      {selected ? (
                        <span className="size-1.5 bg-primary-foreground" />
                      ) : null}
                    </span>
                    <FileText className="size-3.5 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{doc.name}</span>
                    {!ready ? (
                      <span className="shrink-0 font-mono text-[0.625rem] uppercase tracking-wider text-muted-foreground">
                        {doc.status.__kind__}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <SectionLabel>Chat history</SectionLabel>
        {isLoadingSessions ? (
          <p
            data-ocid="chat.sessions_loading_state"
            className="px-3 pb-3 font-mono text-xs text-muted-foreground"
          >
            Loading…
          </p>
        ) : sessions.length === 0 ? (
          <p
            data-ocid="chat.sessions_empty_state"
            className="px-3 pb-3 text-sm text-muted-foreground"
          >
            No conversations yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5 px-2 pb-4">
            {sessions.map((session) => {
              const active = activeSessionId === session.id;
              return (
                <li key={Number(session.id)} className="group relative">
                  <button
                    type="button"
                    data-ocid={`chat.session_item.${Number(session.id)}`}
                    aria-current={active ? "true" : undefined}
                    onClick={() => onSelectSession(session.id)}
                    className={cn(
                      "flex w-full flex-col gap-0.5 border px-2.5 py-2 pr-9 text-left transition-colors",
                      active
                        ? "border-primary/60 bg-primary/10"
                        : "border-transparent hover:bg-sidebar-accent",
                    )}
                  >
                    <span className="min-w-0 truncate text-sm text-foreground">
                      {session.title}
                    </span>
                    <span className="font-mono text-[0.625rem] uppercase tracking-wider text-muted-foreground">
                      {formatRelativeTime(session.updatedAt)} ·{" "}
                      {Number(session.messageCount)} msg
                    </span>
                  </button>
                  <button
                    type="button"
                    data-ocid={`chat.delete_session_button.${Number(session.id)}`}
                    aria-label={`Delete conversation ${session.title}`}
                    onClick={() => onDeleteSession(session.id)}
                    className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center text-muted-foreground transition-opacity hover:text-destructive focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
