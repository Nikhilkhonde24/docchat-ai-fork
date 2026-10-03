import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AskResult {
    answer: Message;
    session: ChatSessionView;
}
export interface Cell {
    value: Value;
    name: string;
}
export type ChatSessionId = bigint;
export interface ChatSessionSummary {
    id: ChatSessionId;
    title: string;
    documentIds: Array<DocumentId>;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    messageCount: bigint;
}
export interface ChatSessionView {
    id: ChatSessionId;
    title: string;
    documentIds: Array<DocumentId>;
    messages: Array<Message>;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface Citation {
    documentName: string;
    passage: string;
    documentId: DocumentId;
    index: bigint;
}
export interface DocumentDetail {
    id: DocumentId;
    status: ProcessingStatus;
    name: string;
    fileType: FileType;
    extractedText?: string;
    storageRef: string;
    sizeBytes: bigint;
    uploadedAt: Timestamp;
}
export interface DocumentFilter {
    nameContains?: string;
    fileType?: FileType;
}
export type DocumentId = bigint;
export interface DocumentView {
    id: DocumentId;
    status: ProcessingStatus;
    name: string;
    fileType: FileType;
    hasExtractedText: boolean;
    sizeBytes: bigint;
    uploadedAt: Timestamp;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface Message {
    id: MessageId;
    content: string;
    createdAt: Timestamp;
    role: MessageRole;
    citations: Array<Citation>;
}
export type MessageId = bigint;
export type ProcessingStatus = {
    __kind__: "pending";
    pending: null;
} | {
    __kind__: "processing";
    processing: null;
} | {
    __kind__: "ready";
    ready: null;
} | {
    __kind__: "failed";
    failed: string;
};
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type Timestamp = bigint;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum FileType {
    pdf = "pdf",
    txt = "txt",
    markdown = "markdown"
}
export enum MessageRole {
    user = "user",
    assistant = "assistant"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    /**
     * / Ask a question in a chat session. The backend retrieves the selected
     * / documents' text, calls Caffeine Inference, and returns the answer with
     * / numbered citations. No API key is collected or stored.
     */
    askQuestion(sessionId: ChatSessionId, question: string): Promise<AskResult>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Start a new chat session bound to the given documents.
     */
    createChatSession(title: string, documentIds: Array<DocumentId>): Promise<ChatSessionView>;
    /**
     * / Register an uploaded document. The file bytes are stored via platform
     * / file storage; `storageRef` is the resulting reference.
     */
    createDocument(name: string, fileType: FileType, sizeBytes: bigint, storageRef: string): Promise<DocumentId>;
    /**
     * / Delete one of the caller's chat sessions.
     */
    deleteChatSession(id: ChatSessionId): Promise<boolean>;
    /**
     * / Delete one of the caller's documents.
     */
    deleteDocument(id: DocumentId): Promise<boolean>;
    execute(qJson: string): Promise<Result>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Fetch one of the caller's chat sessions with its message history.
     */
    getChatSession(id: ChatSessionId): Promise<ChatSessionView | null>;
    /**
     * / Fetch one of the caller's documents with its extracted text preview.
     */
    getDocument(id: DocumentId): Promise<DocumentDetail | null>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / List the caller's chat sessions.
     */
    listChatSessions(): Promise<Array<ChatSessionSummary>>;
    /**
     * / List the caller's documents, optionally filtered by name and file type.
     */
    listDocuments(filter: DocumentFilter): Promise<Array<DocumentView>>;
    /**
     * / Rename one of the caller's documents.
     */
    renameDocument(id: DocumentId, newName: string): Promise<DocumentView | null>;
    schema(): Promise<string>;
    /**
     * / Store extracted text for a document and mark it ready.
     */
    setExtractedText(id: DocumentId, text: string): Promise<DocumentDetail | null>;
    /**
     * / Mark a document's extraction as failed.
     */
    setProcessingFailed(id: DocumentId, reason: string): Promise<DocumentDetail | null>;
}
