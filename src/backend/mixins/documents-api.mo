import Map "mo:core/Map";
import Common "../types/common";
import Types "../types/documents";
import DocumentsLib "../lib/documents";

mixin (
  documents : Map.Map<Common.DocumentId, Types.Document>,
  nextDocumentId : { var value : Nat },
) {
  /// List the caller's documents, optionally filtered by name and file type.
  public query ({ caller }) func listDocuments(
    filter : Types.DocumentFilter,
  ) : async [Types.DocumentView] {
    DocumentsLib.listDocuments(documents, caller, filter);
  };

  /// Fetch one of the caller's documents with its extracted text preview.
  public query ({ caller }) func getDocument(
    id : Common.DocumentId,
  ) : async ?Types.DocumentDetail {
    DocumentsLib.getDocument(documents, caller, id);
  };

  /// Register an uploaded document. The file bytes are stored via platform
  /// file storage; `storageRef` is the resulting reference.
  public shared ({ caller }) func createDocument(
    name : Text,
    fileType : Types.FileType,
    sizeBytes : Nat,
    storageRef : Text,
  ) : async Common.DocumentId {
    DocumentsLib.createDocument(documents, nextDocumentId, caller, name, fileType, sizeBytes, storageRef);
  };

  /// Rename one of the caller's documents.
  public shared ({ caller }) func renameDocument(
    id : Common.DocumentId,
    newName : Text,
  ) : async ?Types.DocumentView {
    DocumentsLib.renameDocument(documents, caller, id, newName);
  };

  /// Delete one of the caller's documents.
  public shared ({ caller }) func deleteDocument(
    id : Common.DocumentId,
  ) : async Bool {
    DocumentsLib.deleteDocument(documents, caller, id);
  };

  /// Store extracted text for a document and mark it ready.
  public shared ({ caller }) func setExtractedText(
    id : Common.DocumentId,
    text : Text,
  ) : async ?Types.DocumentDetail {
    DocumentsLib.setExtractedText(documents, caller, id, text);
  };

  /// Mark a document's extraction as failed.
  public shared ({ caller }) func setProcessingFailed(
    id : Common.DocumentId,
    reason : Text,
  ) : async ?Types.DocumentDetail {
    DocumentsLib.setProcessingFailed(documents, caller, id, reason);
  };
};
