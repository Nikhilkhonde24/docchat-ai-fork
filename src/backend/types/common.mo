module {
  /// Unique identifier for a document, assigned by the backend on upload.
  public type DocumentId = Nat;

  /// Unique identifier for a chat session, assigned by the backend on creation.
  public type ChatSessionId = Nat;

  /// Unique identifier for a chat message within a session.
  public type MessageId = Nat;

  /// Nanoseconds since the Unix epoch (as returned by `Time.now()`).
  public type Timestamp = Int;

  /// Owner of a record — the principal that created it.
  public type Owner = Principal;

  /// Generic failure returned by mutating endpoints.
  public type ApiError = {
    #notFound;
    #notAuthorized;
    #invalidInput : Text;
    #inferenceFailed : Text;
  };
};
