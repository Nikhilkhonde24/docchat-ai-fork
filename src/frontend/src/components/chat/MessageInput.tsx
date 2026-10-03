import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";

interface MessageInputProps {
  onSend: (question: string) => void;
  isPending: boolean;
  disabled: boolean;
  disabledReason?: string;
}

/**
 * Composer for the chat workspace. Owns its draft locally and clears it
 * synchronously on submit so a failed round-trip can restore the text.
 */
export function MessageInput({
  onSend,
  isPending,
  disabled,
  disabledReason,
}: MessageInputProps) {
  const [draft, setDraft] = useState("");

  const trimmed = draft.trim();
  const canSend = trimmed.length > 0 && !isPending && !disabled;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;
    const question = trimmed;
    setDraft("");
    onSend(question);
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-ocid="chat.composer"
      className="border-t border-border bg-background px-4 py-3 md:px-6"
    >
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
        <label htmlFor="chat-question" className="sr-only">
          Ask a question about the selected documents
        </label>
        <Textarea
          id="chat-question"
          data-ocid="chat.input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder={
            disabled
              ? (disabledReason ?? "Select a document to start chatting")
              : "Ask a question about the selected documents…"
          }
          disabled={disabled}
          rows={1}
          className="max-h-40 min-h-[2.75rem] flex-1 resize-none rounded-none border-border bg-card text-sm focus-visible:ring-1 focus-visible:ring-ring"
        />
        <Button
          type="submit"
          size="icon"
          data-ocid="chat.send_button"
          disabled={!canSend}
          aria-label="Send question"
          className="size-11 shrink-0 rounded-none"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowUp className="size-4" />
          )}
        </Button>
      </div>
      <p className="mx-auto mt-2 w-full max-w-3xl font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
        {disabled
          ? (disabledReason ?? "Select a document to start chatting")
          : "Enter to send · Shift + Enter for a new line"}
      </p>
    </form>
  );
}
