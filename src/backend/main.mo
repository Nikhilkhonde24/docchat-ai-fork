import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Common "types/common";
import DocumentTypes "types/documents";
import ChatTypes "types/chat";
import DocumentsApi "mixins/documents-api";
import ChatApi "mixins/chat-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;

  let documents : Map.Map<Common.DocumentId, DocumentTypes.Document>;
  let nextDocumentId : { var value : Nat };

  let sessions : Map.Map<Common.ChatSessionId, ChatTypes.ChatSession>;
  let nextSessionId : { var value : Nat };
  let nextMessageId : { var value : Nat };

  // Sample owner used only to seed OQL schema discovery; the value is ignored.
  transient let sampleOwner = Principal.fromText("aaaaa-aa");

  // Render a document's processing status as a stable text tag so the column
  // is queryable without a variant `_toRow` instance.
  func statusText(status : DocumentTypes.ProcessingStatus) : Text =
    switch (status) {
      case (#pending) "pending";
      case (#processing) "processing";
      case (#ready) "ready";
      case (#failed(_)) "failed";
    };

  func fileTypeText(fileType : DocumentTypes.FileType) : Text =
    switch (fileType) {
      case (#pdf) "pdf";
      case (#txt) "txt";
      case (#markdown) "markdown";
    };

  func roleText(role : ChatTypes.MessageRole) : Text =
    switch (role) {
      case (#user) "user";
      case (#assistant) "assistant";
    };

  // Flatten every session's messages into one row per message, carrying the
  // owning session's principal so per-user scoping applies to the message table.
  func messageRows() : Iter.Iter<(ChatTypes.ChatSession, ChatTypes.Message)> {
    let out = List.empty<(ChatTypes.ChatSession, ChatTypes.Message)>();
    for (session in sessions.values()) {
      for (message in session.messages.values()) {
        out.add((session, message));
      };
    };
    out.values();
  };

  include MixinAuthorization(accessControlState, null);
  include DocumentsApi(documents, nextDocumentId);
  include ChatApi(sessions, nextSessionId, nextMessageId, documents);
  include ApiDocMixin();
  include Expose({
    entities = [
      // Documents: each signed-in user reads only their own rows; the platform
      // controller (and the Data Intelligence agent) reads every row.
      // `extractedText` and `storageRef` are large/opaque and stay hidden.
      documents.toEntityManual("document", "Document", "id")
        .sample({
          id = 0;
          owner = sampleOwner;
          name = "";
          fileType = #pdf;
          sizeBytes = 0;
          uploadedAt = 0;
          status = #pending;
          extractedText = null;
          storageRef = "";
        })
        .payload("id", func d = d.id)
        .payload("owner", func d = d.owner)
        .payload("name", func d = d.name)
        .payload("fileType", func d = fileTypeText(d.fileType))
        .payload("sizeBytes", func d = d.sizeBytes)
        .payload("uploadedAt", func d = d.uploadedAt)
        .payload("status", func d = statusText(d.status))
        .payload("hasExtractedText", func d = d.extractedText != null)
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      // Chat sessions: per-user scoped. `messages` is a collection, so it is
      // summarised as a count rather than exposed as a column.
      sessions.toEntityManual("chatSession", "ChatSession", "id")
        .sample({
          id = 0;
          owner = sampleOwner;
          title = "";
          documentIds = [];
          messages = [];
          createdAt = 0;
          updatedAt = 0;
        })
        .payload("id", func s = s.id)
        .payload("owner", func s = s.owner)
        .payload("title", func s = s.title)
        .payload("messageCount", func s = s.messages.size())
        .payload("createdAt", func s = s.createdAt)
        .payload("updatedAt", func s = s.updatedAt)
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      // Chat messages: one row per message, flattened across sessions, scoped
      // to the owning session's principal.
      Entity.manual<(ChatTypes.ChatSession, ChatTypes.Message)>(
        "chatMessage",
        messageRows,
        "ChatMessage",
        "id",
      )
        .sample((
          {
            id = 0;
            owner = sampleOwner;
            title = "";
            documentIds = [];
            messages = [];
            createdAt = 0;
            updatedAt = 0;
          },
          { id = 0; role = #user; content = ""; citations = []; createdAt = 0 },
        ))
        .payload("id", func ((_, m)) = m.id)
        .payload("sessionId", func ((s, _)) = s.id)
        .payload("owner", func ((s, _)) = s.owner)
        .payload("role", func ((_, m)) = roleText(m.role))
        .payload("content", func ((_, m)) = m.content)
        .payload("citationCount", func ((_, m)) = m.citations.size())
        .payload("createdAt", func ((_, m)) = m.createdAt)
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
    ];
  });
};
