import Common "common";

module {
  public type DocumentId = Common.DocumentId;
  public type Timestamp = Common.Timestamp;
  public type Owner = Common.Owner;

  /// Supported source file types. DOCX/PPTX are intentionally out of scope.
  public type FileType = {
    #pdf;
    #txt;
    #markdown;
  };

  /// Lifecycle of a document's text extraction.
  /// `#pending` — uploaded, extraction not started.
  /// `#processing` — extraction in progress.
  /// `#ready` — text extracted and available for chat.
  /// `#failed` — extraction failed; `error` carries the reason.
  public type ProcessingStatus = {
    #pending;
    #processing;
    #ready;
    #failed : Text;
  };

  /// Internal document record. `extractedText` and `storageRef` are not
  /// exposed verbatim through list views.
  public type Document = {
    id : DocumentId;
    owner : Owner;
    name : Text;
    fileType : FileType;
    sizeBytes : Nat;
    uploadedAt : Timestamp;
    status : ProcessingStatus;
    extractedText : ?Text;
    storageRef : Text;
  };

  /// Public document view returned by list/get endpoints.
  public type DocumentView = {
    id : DocumentId;
    name : Text;
    fileType : FileType;
    sizeBytes : Nat;
    uploadedAt : Timestamp;
    status : ProcessingStatus;
    hasExtractedText : Bool;
  };

  /// Detail view including a preview of the extracted text.
  public type DocumentDetail = {
    id : DocumentId;
    name : Text;
    fileType : FileType;
    sizeBytes : Nat;
    uploadedAt : Timestamp;
    status : ProcessingStatus;
    extractedText : ?Text;
    storageRef : Text;
  };

  /// Filter applied when listing the caller's documents.
  public type DocumentFilter = {
    nameContains : ?Text;
    fileType : ?FileType;
  };
};
