import { PocketIc } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
// Set only on a converted project: the last pre-EM revision, whose schema this
// app's migration chain replays from. Installing the current wasm onto an empty
// canister there traps IC0503 before any test runs.
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  if (BASELINE_WASM === undefined) {
    ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({
      idlFactory,
      wasm: BACKEND_WASM,
    }));
    return;
  }
  // `[baseline, current]`, the same install contract the hosted deploy uses for
  // a converted project. The upgrade replays the chain from the legacy schema.
  const installed = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BASELINE_WASM,
  });
  await pic.upgradeCanister({
    canisterId: installed.canisterId,
    wasm: BACKEND_WASM,
    arg: new Uint8Array(),
  });
  ({ actor, canisterId } = installed);
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far. A failed
  // `PocketIc.create` otherwise stacks "Cannot read properties of undefined"
  // on top of the real error and buries the one line that explains the run.
  await pic?.tearDown();
});

it("answers empty-state reads instead of trapping", async () => {
  await expect(
    actor.listDocuments({ nameContains: [], fileType: [] }),
  ).resolves.toEqual([]);
  await expect(actor.listChatSessions()).resolves.toEqual([]);
});

it("round-trips a document through the real canister", async () => {
  const id = await actor.createDocument("spec.pdf", { pdf: null }, 1024n, "sha256:abc");
  const listed = await actor.listDocuments({ nameContains: [], fileType: [] });
  expect(listed).toContainEqual(
    expect.objectContaining({ id, name: "spec.pdf", fileType: { pdf: null } }),
  );

  const detail = await actor.getDocument(id);
  expect(detail).toHaveLength(1);
  expect(detail[0]).toMatchObject({ id, name: "spec.pdf", status: { pending: null } });

  const renamed = await actor.renameDocument(id, "renamed.pdf");
  expect(renamed).toHaveLength(1);
  expect(renamed[0]).toMatchObject({ id, name: "renamed.pdf" });

  const ready = await actor.setExtractedText(id, "The pipeline chunks on section boundaries.");
  expect(ready).toHaveLength(1);
  expect(ready[0]).toMatchObject({ id, status: { ready: null } });
  expect(ready[0].extractedText).toEqual(["The pipeline chunks on section boundaries."]);

  await expect(actor.deleteDocument(id)).resolves.toBe(true);
  await expect(
    actor.listDocuments({ nameContains: [], fileType: [] }),
  ).resolves.toEqual([]);
});

it("filters the library by name and file type", async () => {
  const pdfId = await actor.createDocument("alpha.pdf", { pdf: null }, 10n, "sha256:a");
  const txtId = await actor.createDocument("beta.txt", { txt: null }, 20n, "sha256:b");

  const byName = await actor.listDocuments({ nameContains: ["alpha"], fileType: [] });
  expect(byName.map((doc) => doc.id)).toEqual([pdfId]);

  const byType = await actor.listDocuments({ nameContains: [], fileType: [{ txt: null }] });
  expect(byType.map((doc) => doc.id)).toEqual([txtId]);

  await actor.deleteDocument(pdfId);
  await actor.deleteDocument(txtId);
});

it("persists a chat session and its messages across reads", async () => {
  const docId = await actor.createDocument("notes.txt", { txt: null }, 5n, "sha256:c");
  await actor.setExtractedText(docId, "Action items: ship the migration.");

  const session = await actor.createChatSession("Summarize", [docId]);
  expect(session.messages).toEqual([]);

  const fetched = await actor.getChatSession(session.id);
  expect(fetched).toHaveLength(1);
  expect(fetched[0]).toMatchObject({ id: session.id, title: "Summarize" });

  const summaries = await actor.listChatSessions();
  expect(summaries).toContainEqual(
    expect.objectContaining({ id: session.id, title: "Summarize", messageCount: 0n }),
  );

  await expect(actor.deleteChatSession(session.id)).resolves.toBe(true);
  await expect(actor.getChatSession(session.id)).resolves.toEqual([]);
  await actor.deleteDocument(docId);
});
