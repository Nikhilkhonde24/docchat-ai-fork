import type { Citation, Message } from "@/backend";
import { CitationChip, CitationPassage } from "@/components/chat/CitationChip";
import { cn } from "@/lib/utils";
import { Bot, Loader2, Quote, User } from "lucide-react";
import { useState } from "react";

interface MessageListProps {
  messages: Message[];
  isPending: boolean;
  pendingQuestion: string | null;
  error: string | null;
  onRetry: () => void;
}

function MessageBubble({ message }: { message: Message }) {
  const [openCitation, setOpenCitation] = useState<Citation | null>(null);
  const isUser = message.role === "user";

  return (
    <div
      data-ocid={`chat.message.${Number(message.id)}`}
      className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}
    >
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center border",
          isUser
            ? "border-border bg-muted text-muted-foreground"
            : "border-primary bg-primary text-primary-foreground",
        )}
      >
        {isUser ? (
          <User className="size-3.5" />
        ) : (
          <Quote className="size-3.5" />
        )}
      </span>

      <div
        className={cn(
          "min-w-0 max-w-[85%] border px-4 py-3",
          isUser ? "border-border bg-card" : "border-border bg-card/60",
        )}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {message.content}
          {message.citations.map((citation) => (
            <CitationChip
              key={Number(citation.index)}
              citation={citation}
              active={openCitation?.index === citation.index}
              onSelect={(next) =>
                setOpenCitation((current) =>
                  current?.index === next.index ? null : next,
                )
              }
            />
          ))}
        </p>

        {openCitation ? (
          <CitationPassage
            citation={openCitation}
            onClose={() => setOpenCitation(null)}
          />
        ) : null}
      </div>
    </div>
  );
}

/**
 * Conversation transcript. Renders persisted messages plus the in-flight
 * question and a pending indicator while inference runs.
 */
export function MessageList({
  messages,
  isPending,
  pendingQuestion,
  error,
  onRetry,
}: MessageListProps) {
  return (
    <div
      data-ocid="chat.message_list"
      className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 md:px-6"
    >
      {messages.map((message) => (
        <MessageBubble key={Number(message.id)} message={message} />
      ))}

      {isPending && pendingQuestion ? (
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center border border-border bg-muted text-muted-foreground">
            <User className="size-3.5" />
          </span>
          <div className="min-w-0 max-w-[85%] border border-border bg-card px-4 py-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {pendingQuestion}
            </p>
          </div>
        </div>
      ) : null}

      {isPending ? (
        <div
          data-ocid="chat.loading_state"
          className="flex items-center gap-3"
          aria-live="polite"
        >
          <span className="flex size-7 shrink-0 items-center justify-center border border-primary bg-primary text-primary-foreground">
            <Bot className="size-3.5" />
          </span>
          <span className="flex items-center gap-2 border border-border bg-card/60 px-4 py-3 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin text-primary" />
            Reading the selected documents…
          </span>
        </div>
      ) : null}

      {error ? (
        <div
          data-ocid="chat.error_state"
          role="alert"
          className="flex flex-col items-start gap-3 border border-destructive/50 bg-destructive/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-foreground">{error}</p>
          <button
            type="button"
            data-ocid="chat.retry_button"
            onClick={onRetry}
            className="shrink-0 border border-destructive/60 px-3 py-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-destructive/20"
          >
            Retry
          </button>
        </div>
      ) : null}
    </div>
  );
}
