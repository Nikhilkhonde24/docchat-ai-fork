import { fromEnv } "mo:caffeineai-inference-client/Config";
import ChatApi "mo:caffeineai-inference-client/Apis/ChatApi";
import ChatCompletionRequest "mo:caffeineai-inference-client/Models/ChatCompletionRequest";
import ChatCompletionRequestMessage "mo:caffeineai-inference-client/Models/ChatCompletionRequestMessage";
import ChatCompletionRequestMessageOneOf "mo:caffeineai-inference-client/Models/ChatCompletionRequestMessageOneOf";
import ChatCompletionRequestMessageOneOf2 "mo:caffeineai-inference-client/Models/ChatCompletionRequestMessageOneOf2";
import ChatCompletionRequestMessageOneOf3 "mo:caffeineai-inference-client/Models/ChatCompletionRequestMessageOneOf3";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Types "../types/chat";

module {
  /// A source passage supplied to the model, tagged with the document it came
  /// from so the model can cite it by number.
  public type SourcePassage = {
    documentId : Nat;
    documentName : Text;
    passage : Text;
  };

  let systemPrompt = "You are a document assistant. Answer the user's question using ONLY the numbered source passages provided below. Cite the passages you use with inline bracketed numbers like [1] or [2]. If the answer cannot be found in the provided passages, reply exactly: \"I could not find the answer in the selected documents.\" and do not invent an answer. Do not use outside knowledge.";

  func buildContext(sources : [SourcePassage]) : Text {
    let parts = List.empty<Text>();
    var i = 1;
    for (source in sources.values()) {
      parts.add("[" # i.toText() # "] (from \"" # source.documentName # "\")\n" # source.passage);
      i += 1;
    };
    parts.toArray().values().join("\n\n");
  };

  func roleMessage(role : Types.MessageRole, content : Text) : ChatCompletionRequestMessage.ChatCompletionRequestMessage {
    switch (role) {
      case (#user) {
        #user(ChatCompletionRequestMessageOneOf2.JSON.init({ content = #string(content); role = #user }));
      };
      case (#assistant) {
        #assistant({ ChatCompletionRequestMessageOneOf3.JSON.init({ role = #assistant }) with content = ?#string(content) });
      };
    };
  };

  /// Extract the distinct 1-based citation numbers referenced in the answer,
  /// in ascending order. Handles single citations (`[1]`) as well as
  /// comma- or space-separated groups (`[1, 2]`, `[1,2,3]`). Bracket text that
  /// contains no digits (e.g. `[note]`) is ignored.
  func parseCitationIndices(answer : Text) : [Nat] {
    let found = List.empty<Nat>();
    var inBracket = false;
    var current : ?Nat = null;
    for (c in answer.toIter()) {
      if (c == '[') {
        inBracket := true;
        current := null;
      } else if (c == ']') {
        switch (current) {
          case (?n) {
            if (n > 0 and not found.contains(n)) { found.add(n) };
          };
          case null {};
        };
        inBracket := false;
        current := null;
      } else if (inBracket) {
        let d = c.toNat32();
        if (d >= 48 and d <= 57) {
          let digit = (d - 48).toNat();
          current := ?(switch (current) {
            case (?n) { n * 10 + digit };
            case null { digit };
          });
        } else {
          // A separator (comma, space, etc.) commits the number parsed so far
          // and starts a new one; any other non-digit text is ignored.
          switch (current) {
            case (?n) {
              if (n > 0 and not found.contains(n)) { found.add(n) };
            };
            case null {};
          };
          current := null;
        };
      };
    };
    let arr = found.toArray();
    arr.sort();
  };

  /// Ask Caffeine Inference a question grounded in the supplied source
  /// passages and prior conversation. Returns the answer text and the numbered
  /// citations the model referenced. Credentials come from the platform via
  /// `Config.fromEnv<system>()`; no API key is ever collected or stored.
  public func answerQuestion<system>(
    question : Text,
    history : [(Types.MessageRole, Text)],
    sources : [SourcePassage],
  ) : async* (Text, [Types.Citation]) {
    let config = fromEnv<system>();

    let messages = List.empty<ChatCompletionRequestMessage.ChatCompletionRequestMessage>();
    messages.add(#system_(ChatCompletionRequestMessageOneOf.JSON.init({
      content = #string(systemPrompt);
      role = #system_;
    })));
    for ((role, content) in history.values()) {
      messages.add(roleMessage(role, content));
    };
    let context = buildContext(sources);
    let userContent = if (context.size() == 0) {
      question;
    } else {
      "Source passages:\n\n" # context # "\n\nQuestion: " # question;
    };
    messages.add(#user(ChatCompletionRequestMessageOneOf2.JSON.init({
      content = #string(userContent);
      role = #user;
    })));

    let request = ChatCompletionRequest.JSON.init({
      messages = messages.toArray();
      model = "router";
    });

    let response = await* ChatApi.createChatCompletion(config, request);
    if (response.choices.size() == 0) {
      Runtime.trap("Inference returned no choices");
    };
    let answer = response.choices[0].message.content
      ?? Runtime.trap("Inference returned no text content");

    let citations = List.empty<Types.Citation>();
    let indices = parseCitationIndices(answer);
    var position = 0;
    for (source in sources.values()) {
      position += 1;
      if (indices.contains(position)) {
        citations.add({
          index = position;
          documentId = source.documentId;
          documentName = source.documentName;
          passage = source.passage;
        });
      };
    };
    (answer, citations.toArray());
  };
};
