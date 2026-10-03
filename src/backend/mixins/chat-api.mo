import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Common "../types/common";
import DocumentTypes "../types/documents";
import Types "../types/chat";
import ChatLib "../lib/chat";
import DocumentsLib "../lib/documents";
import Inference "../lib/inference";

mixin (
  sessions : Map.Map<Common.ChatSessionId, Types.ChatSession>,
  nextSessionId : { var value : Nat },
  nextMessageId : { var value : Nat },
  documents : Map.Map<Common.DocumentId, DocumentTypes.Document>,
) {
  func lastMessage(messages : [Types.Message]) : ?Types.Message {
    var last : ?Types.Message = null;
    for (message in messages.values()) { last := ?message };
    last;
  };

  /// List the caller's chat sessions.
  public query ({ caller }) func listChatSessions() : async [Types.ChatSessionSummary] {
    ChatLib.listSessions(sessions, caller);
  };

  /// Fetch one of the caller's chat sessions with its message history.
  public query ({ caller }) func getChatSession(
    id : Common.ChatSessionId,
  ) : async ?Types.ChatSessionView {
    ChatLib.getSession(sessions, caller, id);
  };

  /// Start a new chat session bound to the given documents.
  public shared ({ caller }) func createChatSession(
    title : Text,
    documentIds : [Common.DocumentId],
  ) : async Types.ChatSessionView {
    ChatLib.createSession(sessions, nextSessionId, caller, title, documentIds);
  };

  /// Delete one of the caller's chat sessions.
  public shared ({ caller }) func deleteChatSession(
    id : Common.ChatSessionId,
  ) : async Bool {
    ChatLib.deleteSession(sessions, caller, id);
  };

  /// Ask a question in a chat session. The backend retrieves the selected
  /// documents' text, calls Caffeine Inference, and returns the answer with
  /// numbered citations. No API key is collected or stored.
  public shared ({ caller }) func askQuestion(
    sessionId : Common.ChatSessionId,
    question : Text,
  ) : async Types.AskResult {
    let session = switch (ChatLib.getSession(sessions, caller, sessionId)) {
      case (?s) { s };
      case null { Runtime.trap("Chat session not found") };
    };

    let readyTexts = DocumentsLib.getReadyTexts(documents, caller, session.documentIds);
    let sources = readyTexts.map(func((documentId, documentName, passage)) = {
      documentId;
      documentName;
      passage;
    });

    let history = ChatLib.historyForInference(sessions, caller, sessionId);
    let (answerText, citations) = await* Inference.answerQuestion<system>(question, history, sources);

    ignore ChatLib.appendUserMessage(sessions, nextMessageId, caller, sessionId, question);
    let updated = ChatLib.appendAssistantMessage(sessions, nextMessageId, caller, sessionId, answerText, citations)
      ?? session;

    let answer = switch (lastMessage(updated.messages)) {
      case (?m) { m };
      case null { Runtime.trap("Failed to persist assistant message") };
    };
    { answer; session = updated };
  };
};
