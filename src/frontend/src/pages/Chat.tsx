import type {
  AskResult,
  ChatSessionSummary,
  ChatSessionView,
  DocumentView,
  Message,
} from "@/backend";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBackendActor } from "@/lib/backend";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FileText, MessagesSquare, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

const SUGGESTED_QUESTIONS = [
  "Summarize the key points of this document.",
  "What are the main conclusions?",
  "List any action items or next steps.",
  "Explain the most technical section in plain language.",
];

function buildTitle(question: string): string {
  const trimmed = question.trim();
  if (trimmed.length <= 48) return trimmed;
  return `${trimmed.slice(0, 45)}…`;
}

export function ChatPage() {
  const { isAuthenticated, isInitializing, isLoggingIn, login } = useAuth();
  const { actor, isFetching } = useBackendActor();
  const queryClient = useQueryClient();

  const [selectedDocumentIds, setSelectedDocumentIds] = useState<bigint[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<bigint | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [askError, setAskError] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);

  const documentsQuery = useQuery({
    queryKey: ["documents"],
    queryFn: async (): Promise<DocumentView[]> => {
      if (!actor) return [];
      return actor.listDocuments({});
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });

  const sessionsQuery = useQuery({
    queryKey: ["chatSessions"],
    queryFn: async (): Promise<ChatSessionSummary[]> => {
      if (!actor) return [];
      return actor.listChatSessions();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });

  const sessionQuery = useQuery({
    queryKey: [
      "chatSession",
      activeSessionId === null ? null : Number(activeSessionId),
    ],
    queryFn: async (): Promise<ChatSessionView | null> => {
      if (!actor || activeSessionId === null) return null;
      return actor.getChatSession(activeSessionId);
    },
    enabled: !!actor && !isFetching && activeSessionId !== null,
  });

  const deleteSession = useMutation({
    mutationFn: async (id: bigint): Promise<boolean> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteChatSession(id);
    },
    onSuccess: (_deleted, id) => {
      if (activeSessionId === id) setActiveSessionId(null);
      void queryClient.invalidateQueries({ queryKey: ["chatSessions"] });
    },
  });

  const ask = useMutation({
    mutationFn: async (question: string): Promise<AskResult> => {
      if (!actor) throw new Error("Backend is not ready");
      let sessionId = activeSessionId;
      if (sessionId === null) {
        const created = await actor.createChatSession(
          buildTitle(question),
          selectedDocumentIds,
        );
        sessionId = created.id;
        setActiveSessionId(created.id);
      }
      return actor.askQuestion(sessionId, question);
    },
    onSuccess: (result) => {
      setPendingQuestion(null);
      setAskError(null);
      setLastQuestion(null);
      queryClient.setQueryData(
        ["chatSession", Number(result.session.id)],
        result.session,
      );
      void queryClient.invalidateQueries({ queryKey: ["chatSessions"] });
    },
    onError: () => {
      setPendingQuestion(null);
      setAskError(
        "The answer could not be generated. Check your connection and try again.",
      );
    },
  });

  const documents = documentsQuery.data ?? [];
  const sessions = sessionsQuery.data ?? [];
  const messages: Message[] = sessionQuery.data?.messages ?? [];

  const readySelectedCount = useMemo(
    () =>
      documents.filter(
        (doc) =>
          selectedDocumentIds.includes(doc.id) &&
          doc.status.__kind__ === "ready",
      ).length,
    [documents, selectedDocumentIds],
  );

  function handleToggleDocument(id: bigint) {
    setSelectedDocumentIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  function handleNewChat() {
    setActiveSessionId(null);
    setAskError(null);
    setPendingQuestion(null);
    setLastQuestion(null);
  }

  function handleSelectSession(id: bigint) {
    setActiveSessionId(id);
    // The backend answers from the session's stored documentIds, so mirror that
    // context into the sidebar selection and composer state when reopening.
    const session = sessions.find((item) => item.id === id);
    if (session) setSelectedDocumentIds(session.documentIds);
    setAskError(null);
    setPendingQuestion(null);
    setLastQuestion(null);
  }

  function handleSend(question: string) {
    setAskError(null);
    setLastQuestion(question);
    setPendingQuestion(question);
    ask.mutate(question);
  }

  function handleRetry() {
    if (!lastQuestion) return;
    setAskError(null);
    setPendingQuestion(lastQuestion);
    ask.mutate(lastQuestion);
  }

  if (isInitializing) {
    return (
      <div
        data-ocid="chat.auth_loading_state"
        className="flex min-h-[60vh] items-center justify-center"
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Checking your session…
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        data-ocid="chat.signin_gate"
        className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-4 text-center"
      >
        <span className="mb-6 flex size-12 items-center justify-center border border-border bg-card text-primary">
          <MessagesSquare className="size-6" />
        </span>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-primary">
          Sign in to chat
        </h1>
        <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
          Your documents and conversations are private to your account. Sign in
          with Internet Identity to start asking questions.
        </p>
        <Button
          type="button"
          size="lg"
          data-ocid="chat.signin_button"
          onClick={login}
          disabled={isLoggingIn}
          className="mt-7 rounded-none font-display text-sm font-bold uppercase tracking-wider"
        >
          {isLoggingIn ? "Signing in…" : "Sign in"}
        </Button>
      </div>
    );
  }

  const noReadyDocuments = documents.length === 0;
  const composerDisabled = readySelectedCount === 0;
  const composerDisabledReason = noReadyDocuments
    ? "Upload a document to start chatting"
    : "Select at least one ready document";

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row">
      <div className="h-64 shrink-0 border-b border-border md:h-auto md:w-72 md:border-b-0 lg:w-80">
        <ChatSidebar
          documents={documents}
          sessions={sessions}
          selectedDocumentIds={selectedDocumentIds}
          activeSessionId={activeSessionId}
          isLoadingDocuments={documentsQuery.isLoading}
          isLoadingSessions={sessionsQuery.isLoading}
          onToggleDocument={handleToggleDocument}
          onSelectSession={handleSelectSession}
          onDeleteSession={(id) => deleteSession.mutate(id)}
          onNewChat={handleNewChat}
        />
      </div>

      <section
        data-ocid="chat.panel"
        className="flex min-h-0 min-w-0 flex-1 flex-col bg-background"
      >
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-bold uppercase tracking-tight text-foreground">
              {sessionQuery.data?.title ?? "New conversation"}
            </h1>
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground">
              {readySelectedCount > 0
                ? `${readySelectedCount} document${readySelectedCount === 1 ? "" : "s"} in context`
                : "No documents selected"}
            </p>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {messages.length === 0 && !ask.isPending ? (
            <div
              data-ocid="chat.empty_state"
              className="mx-auto flex w-full max-w-3xl flex-col items-start px-4 py-10 md:px-6"
            >
              <span className="mb-5 flex size-11 items-center justify-center border border-border bg-card text-primary">
                <Sparkles className="size-5" />
              </span>
              <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-primary">
                Ask your documents
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                {noReadyDocuments
                  ? "You have no documents yet. Upload a PDF, TXT, or Markdown file, then return here to ask questions grounded in its content."
                  : composerDisabled
                    ? "Select one or more documents in the sidebar to use as context, then ask a question in plain language."
                    : "Answers are grounded in the documents you selected, with numbered citations back to the exact source passage."}
              </p>

              {noReadyDocuments ? (
                <Button
                  asChild
                  size="lg"
                  data-ocid="chat.upload_document_button"
                  className="mt-6 rounded-none font-display text-sm font-bold uppercase tracking-wider"
                >
                  <Link to="/documents">
                    <FileText className="size-4" />
                    Go to documents
                  </Link>
                </Button>
              ) : null}

              {!composerDisabled ? (
                <div className="mt-7 w-full">
                  <p className="mb-3 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-muted-foreground">
                    Suggested questions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.map((question, index) => (
                      <button
                        key={question}
                        type="button"
                        data-ocid={`chat.suggested_question.${index + 1}`}
                        onClick={() => handleSend(question)}
                        className={cn(
                          "border border-border bg-card px-3 py-2 text-left text-sm text-foreground/90 transition-colors",
                          "hover:border-primary/60 hover:bg-primary/10 hover:text-foreground",
                        )}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <MessageList
              messages={messages}
              isPending={ask.isPending}
              pendingQuestion={pendingQuestion}
              error={askError}
              onRetry={handleRetry}
            />
          )}
        </div>

        <MessageInput
          onSend={handleSend}
          isPending={ask.isPending}
          disabled={composerDisabled}
          disabledReason={composerDisabledReason}
        />
      </section>
    </div>
  );
}
