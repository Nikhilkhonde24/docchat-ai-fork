import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Common "../types/common";
import Types "../types/chat";

module {
  /// Convert an internal session record to its summary view.
  public func toSummary(session : Types.ChatSession) : Types.ChatSessionSummary {
    {
      id = session.id;
      title = session.title;
      documentIds = session.documentIds;
      messageCount = session.messages.size();
      createdAt = session.createdAt;
      updatedAt = session.updatedAt;
    };
  };

  /// Convert an internal session record to its full view.
  public func toView(session : Types.ChatSession) : Types.ChatSessionView {
    {
      id = session.id;
      title = session.title;
      documentIds = session.documentIds;
      messages = session.messages;
      createdAt = session.createdAt;
      updatedAt = session.updatedAt;
    };
  };

  /// List the caller's chat sessions, most recently updated first.
  public func listSessions(
    sessions : Map.Map<Common.ChatSessionId, Types.ChatSession>,
    caller : Principal,
  ) : [Types.ChatSessionSummary] {
    let result = List.empty<Types.ChatSessionSummary>();
    for (session in sessions.values()) {
      if (Principal.equal(session.owner, caller)) {
        result.add(toSummary(session));
      };
    };
    let arr = result.toArray();
    arr.sort(func(a, b) = Int.compare(b.updatedAt, a.updatedAt));
  };

  /// Fetch a chat session owned by `caller`, including its messages.
  public func getSession(
    sessions : Map.Map<Common.ChatSessionId, Types.ChatSession>,
    caller : Principal,
    id : Common.ChatSessionId,
  ) : ?Types.ChatSessionView {
    switch (sessions.get(id)) {
      case (?session) {
        if (Principal.equal(session.owner, caller)) { ?toView(session) } else { null };
      };
      case null { null };
    };
  };

  /// Create a new chat session for `caller` bound to the given documents.
  public func createSession(
    sessions : Map.Map<Common.ChatSessionId, Types.ChatSession>,
    nextSessionId : { var value : Nat },
    caller : Principal,
    title : Text,
    documentIds : [Common.DocumentId],
  ) : Types.ChatSessionView {
    let id = nextSessionId.value;
    nextSessionId.value := id + 1;
    let now = Time.now();
    let session : Types.ChatSession = {
      id;
      owner = caller;
      title;
      documentIds;
      messages = [];
      createdAt = now;
      updatedAt = now;
    };
    sessions.add(id, session);
    toView(session);
  };

  /// Delete a chat session owned by `caller`. Returns true when removed.
  public func deleteSession(
    sessions : Map.Map<Common.ChatSessionId, Types.ChatSession>,
    caller : Principal,
    id : Common.ChatSessionId,
  ) : Bool {
    switch (sessions.get(id)) {
      case (?session) {
        if (Principal.equal(session.owner, caller)) {
          sessions.remove(id);
          true;
        } else {
          false;
        };
      };
      case null { false };
    };
  };

  func appendMessage(
    sessions : Map.Map<Common.ChatSessionId, Types.ChatSession>,
    nextMessageId : { var value : Nat },
    caller : Principal,
    sessionId : Common.ChatSessionId,
    role : Types.MessageRole,
    content : Text,
    citations : [Types.Citation],
  ) : ?Types.ChatSessionView {
    switch (sessions.get(sessionId)) {
      case (?session) {
        if (not Principal.equal(session.owner, caller)) { return null };
        let messageId = nextMessageId.value;
        nextMessageId.value := messageId + 1;
        let now = Time.now();
        let message : Types.Message = {
          id = messageId;
          role;
          content;
          citations;
          createdAt = now;
        };
        let updated : Types.ChatSession = {
          session with
          messages = session.messages.concat([message]);
          updatedAt = now;
        };
        sessions.add(sessionId, updated);
        ?toView(updated);
      };
      case null { null };
    };
  };

  /// Append a user message to a session owned by `caller` and return the
  /// updated session view.
  public func appendUserMessage(
    sessions : Map.Map<Common.ChatSessionId, Types.ChatSession>,
    nextMessageId : { var value : Nat },
    caller : Principal,
    sessionId : Common.ChatSessionId,
    content : Text,
  ) : ?Types.ChatSessionView {
    appendMessage(sessions, nextMessageId, caller, sessionId, #user, content, []);
  };

  /// Append an assistant message (with citations) to a session owned by
  /// `caller` and return the updated session view.
  public func appendAssistantMessage(
    sessions : Map.Map<Common.ChatSessionId, Types.ChatSession>,
    nextMessageId : { var value : Nat },
    caller : Principal,
    sessionId : Common.ChatSessionId,
    content : Text,
    citations : [Types.Citation],
  ) : ?Types.ChatSessionView {
    appendMessage(sessions, nextMessageId, caller, sessionId, #assistant, content, citations);
  };

  /// Build the ordered message history for a session, for use as inference
  /// context.
  public func historyForInference(
    sessions : Map.Map<Common.ChatSessionId, Types.ChatSession>,
    caller : Principal,
    sessionId : Common.ChatSessionId,
  ) : [(Types.MessageRole, Text)] {
    switch (sessions.get(sessionId)) {
      case (?session) {
        if (not Principal.equal(session.owner, caller)) { return [] };
        session.messages.map(func(m) = (m.role, m.content));
      };
      case null { [] };
    };
  };
};
