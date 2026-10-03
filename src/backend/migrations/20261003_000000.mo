import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type DocumentId = Nat;
  type ChatSessionId = Nat;
  type MessageId = Nat;
  type Timestamp = Int;

  type FileType = { #pdf; #txt; #markdown };
  type ProcessingStatus = { #pending; #processing; #ready; #failed : Text };

  type Document = {
    id : DocumentId;
    owner : Principal;
    name : Text;
    fileType : FileType;
    sizeBytes : Nat;
    uploadedAt : Timestamp;
    status : ProcessingStatus;
    extractedText : ?Text;
    storageRef : Text;
  };

  type MessageRole = { #user; #assistant };
  type Citation = {
    index : Nat;
    documentId : DocumentId;
    documentName : Text;
    passage : Text;
  };
  type Message = {
    id : MessageId;
    role : MessageRole;
    content : Text;
    citations : [Citation];
    createdAt : Timestamp;
  };
  type ChatSession = {
    id : ChatSessionId;
    owner : Principal;
    title : Text;
    documentIds : [DocumentId];
    messages : [Message];
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  type OldActor = {};

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    documents : Map.Map<DocumentId, Document>;
    nextDocumentId : { var value : Nat };
    sessions : Map.Map<ChatSessionId, ChatSession>;
    nextSessionId : { var value : Nat };
    nextMessageId : { var value : Nat };
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      documents = Map.empty();
      nextDocumentId = { var value = 0 };
      sessions = Map.empty();
      nextSessionId = { var value = 0 };
      nextMessageId = { var value = 0 };
    };
  };
};
