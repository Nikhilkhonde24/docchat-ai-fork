import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Common "../types/common";
import Types "../types/documents";

module {
  /// Convert an internal document record to its public list view.
  public func toView(doc : Types.Document) : Types.DocumentView {
    {
      id = doc.id;
      name = doc.name;
      fileType = doc.fileType;
      sizeBytes = doc.sizeBytes;
      uploadedAt = doc.uploadedAt;
      status = doc.status;
      hasExtractedText = doc.extractedText != null;
    };
  };

  /// Convert an internal document record to its detail view.
  public func toDetail(doc : Types.Document) : Types.DocumentDetail {
    {
      id = doc.id;
      name = doc.name;
      fileType = doc.fileType;
      sizeBytes = doc.sizeBytes;
      uploadedAt = doc.uploadedAt;
      status = doc.status;
      extractedText = doc.extractedText;
      storageRef = doc.storageRef;
    };
  };

  func matchesFilter(doc : Types.Document, filter : Types.DocumentFilter) : Bool {
    let nameOk = switch (filter.nameContains) {
      case (?needle) {
        needle.size() == 0 or doc.name.toLower().contains(#text (needle.toLower()));
      };
      case null { true };
    };
    let typeOk = switch (filter.fileType) {
      case (?ft) { doc.fileType == ft };
      case null { true };
    };
    nameOk and typeOk;
  };

  /// List the caller's documents, optionally filtered by name substring and
  /// file type. Only documents owned by `caller` are returned.
  public func listDocuments(
    documents : Map.Map<Common.DocumentId, Types.Document>,
    caller : Principal,
    filter : Types.DocumentFilter,
  ) : [Types.DocumentView] {
    let result = List.empty<Types.DocumentView>();
    for (doc in documents.values()) {
      if (Principal.equal(doc.owner, caller) and matchesFilter(doc, filter)) {
        result.add(toView(doc));
      };
    };
    result.toArray();
  };

  /// Fetch a single document owned by `caller`. Returns null when the document
  /// does not exist or is owned by someone else.
  public func getDocument(
    documents : Map.Map<Common.DocumentId, Types.Document>,
    caller : Principal,
    id : Common.DocumentId,
  ) : ?Types.DocumentDetail {
    switch (documents.get(id)) {
      case (?doc) {
        if (Principal.equal(doc.owner, caller)) { ?toDetail(doc) } else { null };
      };
      case null { null };
    };
  };

  /// Register a newly uploaded document for `caller` and return its id.
  public func createDocument(
    documents : Map.Map<Common.DocumentId, Types.Document>,
    nextDocumentId : { var value : Nat },
    caller : Principal,
    name : Text,
    fileType : Types.FileType,
    sizeBytes : Nat,
    storageRef : Text,
  ) : Common.DocumentId {
    let id = nextDocumentId.value;
    nextDocumentId.value := id + 1;
    let doc : Types.Document = {
      id;
      owner = caller;
      name;
      fileType;
      sizeBytes;
      uploadedAt = Time.now();
      status = #pending;
      extractedText = null;
      storageRef;
    };
    documents.add(id, doc);
    id;
  };

  /// Rename a document owned by `caller`.
  public func renameDocument(
    documents : Map.Map<Common.DocumentId, Types.Document>,
    caller : Principal,
    id : Common.DocumentId,
    newName : Text,
  ) : ?Types.DocumentView {
    switch (documents.get(id)) {
      case (?doc) {
        if (not Principal.equal(doc.owner, caller)) { return null };
        let updated : Types.Document = { doc with name = newName };
        documents.add(id, updated);
        ?toView(updated);
      };
      case null { null };
    };
  };

  /// Delete a document owned by `caller`. Returns true when a document was
  /// removed.
  public func deleteDocument(
    documents : Map.Map<Common.DocumentId, Types.Document>,
    caller : Principal,
    id : Common.DocumentId,
  ) : Bool {
    switch (documents.get(id)) {
      case (?doc) {
        if (Principal.equal(doc.owner, caller)) {
          documents.remove(id);
          true;
        } else {
          false;
        };
      };
      case null { false };
    };
  };

  /// Store the extracted text for a document and mark it ready.
  public func setExtractedText(
    documents : Map.Map<Common.DocumentId, Types.Document>,
    caller : Principal,
    id : Common.DocumentId,
    text : Text,
  ) : ?Types.DocumentDetail {
    switch (documents.get(id)) {
      case (?doc) {
        if (not Principal.equal(doc.owner, caller)) { return null };
        let updated : Types.Document = {
          doc with
          status = #ready;
          extractedText = ?text;
        };
        documents.add(id, updated);
        ?toDetail(updated);
      };
      case null { null };
    };
  };

  /// Mark a document's extraction as failed with a reason.
  public func setProcessingFailed(
    documents : Map.Map<Common.DocumentId, Types.Document>,
    caller : Principal,
    id : Common.DocumentId,
    reason : Text,
  ) : ?Types.DocumentDetail {
    switch (documents.get(id)) {
      case (?doc) {
        if (not Principal.equal(doc.owner, caller)) { return null };
        let updated : Types.Document = { doc with status = #failed(reason) };
        documents.add(id, updated);
        ?toDetail(updated);
      };
      case null { null };
    };
  };

  /// Fetch the extracted text of documents owned by `caller`, in the order
  /// requested. Documents that are missing, not owned, or not ready are
  /// omitted.
  public func getReadyTexts(
    documents : Map.Map<Common.DocumentId, Types.Document>,
    caller : Principal,
    ids : [Common.DocumentId],
  ) : [(Common.DocumentId, Text, Text)] {
    let result = List.empty<(Common.DocumentId, Text, Text)>();
    for (id in ids.values()) {
      switch (documents.get(id)) {
        case (?doc) {
          if (Principal.equal(doc.owner, caller)) {
            switch (doc.extractedText) {
              case (?text) { result.add((doc.id, doc.name, text)) };
              case null {};
            };
          };
        };
        case null {};
      };
    };
    result.toArray();
  };
};
