import { FileType, MessageRole } from "@/backend";
import {
  asBackend,
  createMockBackend,
  makeAskResult,
  makeDocumentView,
  makeMessage,
  makeSession,
} from "@/test/actor";
import { authState, resetAuth, setAuth } from "@/test/auth";
import { renderApp } from "@/test/render";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => authState,
}));

const backend = createMockBackend();
vi.mock("@/lib/backend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/backend")>();
  return {
    ...actual,
    useBackendActor: () => ({ actor: asBackend(backend), isFetching: false }),
  };
});

const READY_DOC = makeDocumentView({
  id: 1n,
  name: "architecture-spec.pdf",
  fileType: FileType.pdf,
  status: { __kind__: "ready", ready: null },
});

describe("chat workspace", () => {
  beforeEach(() => {
    resetAuth();
    vi.clearAllMocks();
    backend.listDocuments.mockResolvedValue([READY_DOC]);
    backend.listChatSessions.mockResolvedValue([]);
    backend.getChatSession.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("prompts a signed-out visitor to sign in before chatting", async () => {
    await renderApp({ path: "/chat" });

    expect(screen.getByTestId("chat.signin_gate")).toBeInTheDocument();
    expect(screen.getByText(/Sign in to chat/i)).toBeInTheDocument();
    expect(screen.queryByTestId("chat.composer")).not.toBeInTheDocument();
  });

  it("keeps the composer disabled until a ready document is selected", async () => {
    const user = userEvent.setup();
    setAuth({ isAuthenticated: true });
    await renderApp({ path: "/chat" });

    const toggle = await screen.findByTestId("chat.document_toggle.1");
    expect(screen.getByTestId("chat.input")).toBeDisabled();

    await user.click(toggle);

    await waitFor(() => {
      expect(screen.getByTestId("chat.input")).toBeEnabled();
    });
    expect(screen.getByTestId("chat.suggested_question.1")).toBeInTheDocument();
  });

  it("answers a question with a numbered citation and reveals the source passage", async () => {
    const user = userEvent.setup();
    setAuth({ isAuthenticated: true });
    const answeredSession = makeSession({
      id: 1n,
      title: "How does chunking work?",
      documentIds: [1n],
      messages: [
        makeMessage({
          id: 1n,
          role: MessageRole.user,
          content: "How does chunking work?",
        }),
        makeMessage({
          id: 2n,
          role: MessageRole.assistant,
          content: "The pipeline chunks on section boundaries.",
          citations: [
            {
              index: 1n,
              documentId: 1n,
              documentName: "architecture-spec.pdf",
              passage: "Chunking happens on section boundaries.",
            },
          ],
        }),
      ],
    });
    backend.askQuestion.mockResolvedValue(
      makeAskResult({
        answer: answeredSession.messages[1],
        session: answeredSession,
      }),
    );
    // The session query is enabled once the new session id is set, so the
    // reopened read must return the same session the answer was written into.
    backend.getChatSession.mockResolvedValue(answeredSession);

    await renderApp({ path: "/chat" });
    await user.click(await screen.findByTestId("chat.document_toggle.1"));

    await user.type(
      screen.getByTestId("chat.input"),
      "How does chunking work?",
    );
    await user.click(screen.getByTestId("chat.send_button"));

    await waitFor(() => {
      expect(backend.askQuestion).toHaveBeenCalledWith(
        1n,
        "How does chunking work?",
      );
    });

    const chip = await screen.findByTestId("chat.citation_chip.1");
    expect(chip).toHaveTextContent("1");

    await user.click(chip);

    const passage = await screen.findByTestId("chat.citation_passage.1");
    expect(
      within(passage).getByText(/Chunking happens on section boundaries/i),
    ).toBeInTheDocument();
    expect(
      within(passage).getByText("architecture-spec.pdf"),
    ).toBeInTheDocument();
  });

  it("shows the explicit not-found answer instead of inventing one", async () => {
    const user = userEvent.setup();
    setAuth({ isAuthenticated: true });
    const notFoundSession = makeSession({
      id: 1n,
      title: "What is the refund policy?",
      documentIds: [1n],
      messages: [
        makeMessage({
          id: 1n,
          role: MessageRole.user,
          content: "What is the refund policy?",
        }),
        makeMessage({
          id: 2n,
          role: MessageRole.assistant,
          content: "I could not find that in these documents.",
          citations: [],
        }),
      ],
    });
    backend.askQuestion.mockResolvedValue(
      makeAskResult({
        answer: notFoundSession.messages[1],
        session: notFoundSession,
      }),
    );
    backend.getChatSession.mockResolvedValue(notFoundSession);

    await renderApp({ path: "/chat" });
    await user.click(await screen.findByTestId("chat.document_toggle.1"));
    await user.type(
      screen.getByTestId("chat.input"),
      "What is the refund policy?",
    );
    await user.click(screen.getByTestId("chat.send_button"));

    expect(
      await screen.findByText(/could not find that in these documents/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("chat.citation_chip.1"),
    ).not.toBeInTheDocument();
  });

  it("reopens a past conversation and restores its history", async () => {
    const user = userEvent.setup();
    setAuth({ isAuthenticated: true });
    backend.listChatSessions.mockResolvedValue([
      {
        id: 5n,
        title: "Summarize",
        documentIds: [1n],
        createdAt: 1_700_000_000_000_000_000n,
        updatedAt: 1_700_000_000_000_000_000n,
        messageCount: 2n,
      },
    ]);
    backend.getChatSession.mockResolvedValue(
      makeSession({
        id: 5n,
        title: "Summarize",
        documentIds: [1n],
        messages: [
          makeMessage({
            id: 1n,
            role: MessageRole.user,
            content: "Summarize the key points.",
          }),
          makeMessage({
            id: 2n,
            role: MessageRole.assistant,
            content: "The document covers three main points.",
          }),
        ],
      }),
    );

    await renderApp({ path: "/chat" });

    await user.click(await screen.findByTestId("chat.session_item.5"));

    await waitFor(() => {
      expect(backend.getChatSession).toHaveBeenCalledWith(5n);
    });
    expect(
      await screen.findByText(/The document covers three main points/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Summarize the key points/i)).toBeInTheDocument();
  });
});
