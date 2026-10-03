import Common "common";
import Documents "documents";

module {
  public type ChatSessionId = Common.ChatSessionId;
  public type MessageId = Common.MessageId;
  public type Timestamp = Common.Timestamp;
  public type Owner = Common.Owner;
  public type DocumentId = Documents.DocumentId;

  /// Who authored a message.
  public type MessageRole = {
    #user;
    #assistant;
  };

  /// A numbered citation pointing at a source passage in one of the selected
  /// documents. `index` is the 1-based number rendered inline in the answer.
  public type Citation = {
    index : Nat;
    documentId : DocumentId;
    documentName : Text;
    passage : Text;
  };

  /// A single turn in a chat session.
  public type Message = {
    id : MessageId;
    role : MessageRole;
    content : Text;
    citations : [Citation];
    createdAt : Timestamp;
  };

  /// Internal chat session record.
  public type ChatSession = {
    id : ChatSessionId;
    owner : Owner;
    title : Text;
    documentIds : [DocumentId];
    messages : [Message];
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  /// Summary view for the conversation list.
  public type ChatSessionSummary = {
    id : ChatSessionId;
    title : Text;
    documentIds : [DocumentId];
    messageCount : Nat;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  /// Full session view including message history.
  public type ChatSessionView = {
    id : ChatSessionId;
    title : Text;
    documentIds : [DocumentId];
    messages : [Message];
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  /// Result of asking a question: the assistant message plus the updated
  /// session view so the caller can render the new turn.
  public type AskResult = {
    answer : Message;
    session : ChatSessionView;
  };
};
