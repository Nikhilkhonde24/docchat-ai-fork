import type {
  AskResult,
  Backend,
  ChatSessionSummary,
  ChatSessionView,
  DocumentDetail,
  DocumentFilter,
  DocumentId,
  DocumentView,
  FileType,
  Message,
} from "@/backend";
import { MessageRole } from "@/backend";
import { vi } from "vitest";

/**
 * A typed, local stand-in for the generated `Backend` actor. Every method is a
 * `vi.fn()` so a test can assert the exact call the UI made, and the default
 * implementations return empty/neutral data so a component renders without a
 * real canister. This is the only backend the frontend suite ever talks to.
 */
export interface MockBackend {
  listDocuments: ReturnType<typeof vi.fn>;
  getDocument: ReturnType<typeof vi.fn>;
  createDocument: ReturnType<typeof vi.fn>;
  renameDocument: ReturnType<typeof vi.fn>;
  deleteDocument: ReturnType<typeof vi.fn>;
  setExtractedText: ReturnType<typeof vi.fn>;
  setProcessingFailed: ReturnType<typeof vi.fn>;
  listChatSessions: ReturnType<typeof vi.fn>;
  getChatSession: ReturnType<typeof vi.fn>;
  createChatSession: ReturnType<typeof vi.fn>;
  deleteChatSession: ReturnType<typeof vi.fn>;
  askQuestion: ReturnType<typeof vi.fn>;
}

export function createMockBackend(): MockBackend {
  return {
    listDocuments: vi.fn(
      async (_filter: DocumentFilter) => [] as DocumentView[],
    ),
    getDocument: vi.fn(
      async (_id: DocumentId) => null as DocumentDetail | null,
    ),
    createDocument: vi.fn(
      async (
        _name: string,
        _fileType: FileType,
        _sizeBytes: bigint,
        _storageRef: string,
      ) => 1n,
    ),
    renameDocument: vi.fn(async (_id: DocumentId, _newName: string) => null),
    deleteDocument: vi.fn(async (_id: DocumentId) => true),
    setExtractedText: vi.fn(async (_id: DocumentId, _text: string) => null),
    setProcessingFailed: vi.fn(
      async (_id: DocumentId, _reason: string) => null,
    ),
    listChatSessions: vi.fn(async () => [] as ChatSessionSummary[]),
    getChatSession: vi.fn(
      async (_id: bigint) => null as ChatSessionView | null,
    ),
    createChatSession: vi.fn(
      async (_title: string, _documentIds: DocumentId[]) =>
        makeSession({ id: 1n, title: _title, documentIds: _documentIds }),
    ),
    deleteChatSession: vi.fn(async (_id: bigint) => true),
    askQuestion: vi.fn(async (_sessionId: bigint, _question: string) => {
      throw new Error("askQuestion not stubbed for this test");
    }),
  };
}

/** Cast a mock to the generated actor type for the `useBackendActor` seam. */
export function asBackend(mock: MockBackend): Backend {
  return mock as unknown as Backend;
}

const NOW = 1_700_000_000_000_000_000n;

export function makeDocumentView(
  overrides: Partial<DocumentView> = {},
): DocumentView {
  return {
    id: 1n,
    name: "spec.pdf",
    fileType: "pdf" as FileType,
    sizeBytes: 2048n,
    uploadedAt: NOW,
    status: { __kind__: "ready", ready: null },
    hasExtractedText: true,
    ...overrides,
  };
}

export function makeDocumentDetail(
  overrides: Partial<DocumentDetail> = {},
): DocumentDetail {
  return {
    id: 1n,
    name: "spec.pdf",
    fileType: "pdf" as FileType,
    sizeBytes: 2048n,
    uploadedAt: NOW,
    status: { __kind__: "ready", ready: null },
    extractedText: "The pipeline chunks on section boundaries.",
    storageRef: "sha256:abcdef0123456789",
    ...overrides,
  };
}

export function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 1n,
    role: MessageRole.assistant,
    content: "The pipeline chunks on section boundaries.",
    citations: [],
    createdAt: NOW,
    ...overrides,
  };
}

export function makeSession(
  overrides: Partial<ChatSessionView> = {},
): ChatSessionView {
  return {
    id: 1n,
    title: "Summarize",
    documentIds: [1n],
    messages: [],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function makeAskResult(overrides: Partial<AskResult> = {}): AskResult {
  return {
    answer: makeMessage(),
    session: makeSession(),
    ...overrides,
  };
}
