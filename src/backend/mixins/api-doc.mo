/// Behavioral API documentation for the document-chat backend.
///
/// This mixin exposes a single static query method, `getApiDoc`, that returns
/// Markdown authored from the current backend source. It reads no actor state,
/// so it takes no parameters and is safe to call anonymously.
mixin () {
  public query func getApiDoc() : async Text {
    "# Document Chat Backend API

This canister backs a dark-theme app for chatting with your own documents.
Users sign in with Internet Identity, upload PDF / TXT / Markdown files, and
ask questions answered from the extracted text of the documents they select.
Each user sees only their own documents and chat sessions.

## Authentication and identity

- Every mutating endpoint and every per-user read is keyed on the caller's
  principal. The frontend signs in with Internet Identity and pins an
  Internet Identity **derivation origin**, published at
  `/.well-known/ii-derivation-origin` when available.
- An agent that already holds the user's Internet Identity authorization can
  derive the correct per-app principal against that origin, for example
  `icp identity link web <name> --app <host>`. Such a delegation acts with the
  user's full authority in this app until it expires.
- There is no separate registration step: the first time a signed-in caller
  invokes a mutating endpoint, its principal becomes the owner of the records
  it creates. A principal that never signed in through this app's frontend is
  simply unknown to the backend and owns no data.
- Anonymous callers are rejected by every endpoint that requires an owner:
  `createDocument`, `renameDocument`, `deleteDocument`, `setExtractedText`,
  `setProcessingFailed`, `createChatSession`, `deleteChatSession`, and
  `askQuestion` all trap or return a not-authorized result for anonymous
  callers. `listDocuments`, `getDocument`, `listChatSessions`, and
  `getChatSession` return only the caller's own rows, so an anonymous caller
  sees an empty list or `null`.

## Public methods

### Documents

- `listDocuments(filter : DocumentFilter) : [DocumentView]` — query. Returns
  the caller's documents, optionally filtered by `nameContains` (case-insensitive
  substring) and `fileType`. Each view carries `id`, `name`, `fileType`,
  `sizeBytes`, `uploadedAt`, `status`, and `hasExtractedText`.
- `getDocument(id : DocumentId) : ?DocumentDetail` — query. Returns the
  caller's document with its extracted-text preview and `storageRef`, or `null`
  when the document does not exist or is owned by someone else.
- `createDocument(name, fileType, sizeBytes, storageRef) : DocumentId` — update.
  Registers an uploaded document. The file bytes are stored via platform file
  storage; `storageRef` is the resulting reference. The new document starts in
  `#pending` status with no extracted text.
- `renameDocument(id, newName) : ?DocumentView` — update. Renames one of the
  caller's documents; `null` when not found or not owned.
- `deleteDocument(id) : Bool` — update. Deletes one of the caller's documents;
  `true` when a document was removed.
- `setExtractedText(id, text) : ?DocumentDetail` — update. Stores extracted
  text and marks the document `#ready`; `null` when not found or not owned.
- `setProcessingFailed(id, reason) : ?DocumentDetail` — update. Marks the
  document `#failed(reason)`; `null` when not found or not owned.

### Chat

- `listChatSessions() : [ChatSessionSummary]` — query. Returns the caller's
  sessions, most recently updated first. Each summary carries `id`, `title`,
  `documentIds`, `messageCount`, `createdAt`, and `updatedAt`.
- `getChatSession(id) : ?ChatSessionView` — query. Returns the caller's session
  with its full message history, or `null` when not found or not owned.
- `createChatSession(title, documentIds) : ChatSessionView` — update. Starts a
  new session bound to the given documents and returns it with an empty history.
- `deleteChatSession(id) : Bool` — update. Deletes one of the caller's
  sessions; `true` when removed.
- `askQuestion(sessionId, question) : AskResult` — update. Retrieves the
  selected documents' extracted text, calls Caffeine Inference, and returns the
  assistant message plus the updated session view. No API key is collected or
  stored. Traps with `\"Chat session not found\"` when the session does not exist
  or is not owned by the caller.

### Data Intelligence (OQL)

- `schema() : Text` — query. Returns the JSON schema of the queryable entities
  the caller may read.
- `execute(qJson : Text) : Result` — query. Runs a JSON query against the
  registered entities. Traps with `\"OQL: invalid query — <reason>\"` on a
  malformed query.

Three entities are registered:

- `document` — one row per document. Per-user scoped: a signed-in caller reads
  only its own rows; the platform controller reads all. `extractedText` and
  `storageRef` are hidden from the schema and default projections.
- `chatSession` — one row per chat session. Per-user scoped. `messages` is
  summarised as `messageCount`.
- `chatMessage` — one row per message, flattened across sessions. Per-user
  scoped via the owning session's principal. `citations` is summarised as
  `citationCount`.

## Units and encodings

- `DocumentId`, `ChatSessionId`, and `MessageId` are `Nat` counters assigned by
  the backend, starting at 0 and increasing by one.
- `Timestamp` values (`uploadedAt`, `createdAt`, `updatedAt`) are `Int`
  nanoseconds since the Unix epoch, as returned by `Time.now()`.
- `sizeBytes` is a `Nat` count of bytes.
- `FileType` is the variant `#pdf | #txt | #markdown`. DOCX and PPTX are not
  supported.
- `ProcessingStatus` is the variant `#pending | #processing | #ready |
  #failed : Text`. In OQL the status is rendered as the text tag
  `\"pending\" | \"processing\" | \"ready\" | \"failed\"`.
- `MessageRole` is the variant `#user | #assistant`, rendered in OQL as
  `\"user\"` or `\"assistant\"`.
- `DocumentFilter` has optional `nameContains : ?Text` and `fileType : ?FileType`;
  a `null` field applies no constraint.
- `ApiError` is the variant `#notFound | #notAuthorized | #invalidInput : Text |
  #inferenceFailed : Text`.

## Lifecycle and polling

- A document moves `#pending` → `#processing` → `#ready` (or `#failed`). The
  backend does not run extraction itself: the frontend drives it by calling
  `setExtractedText` on success or `setProcessingFailed` on failure. Poll
  `listDocuments` or `getDocument` to observe the transition.
- A chat session is created empty and grows one user message plus one assistant
  message per `askQuestion` call. `updatedAt` advances on every appended
  message, so `listChatSessions` orders by recency.
- `askQuestion` is a single update call that awaits inference; it returns only
  after both the user and assistant messages are persisted. There is no
  separate polling step for an answer.

## Mutation retry safety

- `createDocument` and `createChatSession` are **not idempotent**: each call
  allocates a new id and creates a new record. Retrying after a timeout creates
  a duplicate.
- `renameDocument`, `deleteDocument`, `setExtractedText`, `setProcessingFailed`,
  and `deleteChatSession` are idempotent in effect: repeating the same call
  leaves the same final state (`deleteDocument` / `deleteChatSession` return
  `false` on the second call).
- `askQuestion` is **not idempotent**: retrying appends another user message and
  another assistant answer to the session. Do not retry blindly after a
  timeout; re-read the session with `getChatSession` first.

## Errors, traps, and gotchas

- Ownership failures on `getDocument`, `renameDocument`, `deleteDocument`,
  `setExtractedText`, `setProcessingFailed`, and `getChatSession` return `null`
  or `false` rather than trapping, so a caller cannot distinguish \"not found\"
  from \"not yours\".
- `askQuestion` traps with `\"Chat session not found\"` when the session is
  missing or not owned.
- `askQuestion` only uses documents that are owned by the caller **and** in
  `#ready` status; other selected documents are silently omitted from the
  context.
- `getApiDoc` is a static query and reads no state; it is safe to call
  anonymously and its output does not vary per caller.
- OQL `schema()` and `execute()` are per-caller: a signed-in caller sees only
  its own rows, while the platform controller sees all rows.
";
  };
};
