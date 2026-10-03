import { asBackend, createMockBackend, makeDocumentDetail } from "@/test/actor";
import { authState, resetAuth, setAuth } from "@/test/auth";
import { renderApp } from "@/test/render";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => authState,
}));

const backend = createMockBackend();
vi.mock("@/lib/backend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/backend")>();
  return {
    ...actual,
    useBackendActor: () => ({ actor: asBackend(backend), isFetching: false }),
  };
});

describe("document detail", () => {
  beforeEach(() => {
    resetAuth();
    vi.clearAllMocks();
    backend.getDocument.mockResolvedValue(
      makeDocumentDetail({
        id: 1n,
        name: "architecture-spec.pdf",
        extractedText: "The pipeline chunks on section boundaries.",
      }),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("gates a signed-out visitor behind sign in", async () => {
    await renderApp({ path: "/documents/1" });

    expect(
      screen.getByTestId("document_detail.signed_out"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Sign in to view this document/i),
    ).toBeInTheDocument();
  });

  it("shows the extracted text preview and metadata", async () => {
    setAuth({ isAuthenticated: true });
    await renderApp({ path: "/documents/1" });

    expect(
      await screen.findByRole("heading", { name: "architecture-spec.pdf" }),
    ).toBeInTheDocument();

    const preview = screen.getByTestId("document_detail.text_preview");
    expect(
      within(preview).getByText(/The pipeline chunks on section boundaries/i),
    ).toBeInTheDocument();

    const metadata = screen.getByTestId("document_detail.metadata");
    expect(within(metadata).getByText("PDF")).toBeInTheDocument();
    expect(within(metadata).getByText("2.0 KB")).toBeInTheDocument();
  });

  it("renames a document through the confirmation dialog", async () => {
    const user = userEvent.setup();
    setAuth({ isAuthenticated: true });
    backend.renameDocument.mockResolvedValue(
      makeDocumentDetail({ id: 1n, name: "renamed.pdf" }),
    );
    await renderApp({ path: "/documents/1" });

    await screen.findByRole("heading", { name: "architecture-spec.pdf" });
    await user.click(screen.getByTestId("document_detail.rename_button"));

    const input = await screen.findByTestId("document_detail.rename_input");
    await user.clear(input);
    await user.type(input, "renamed.pdf");
    await user.click(screen.getByTestId("document_detail.rename_save_button"));

    await waitFor(() => {
      expect(backend.renameDocument).toHaveBeenCalledWith(1n, "renamed.pdf");
    });
  });

  it("asks for confirmation before deleting and then removes the document", async () => {
    const user = userEvent.setup();
    setAuth({ isAuthenticated: true });
    const { router } = await renderApp({ path: "/documents/1" });

    await screen.findByRole("heading", { name: "architecture-spec.pdf" });
    await user.click(screen.getByTestId("document_detail.delete_button"));

    const dialog = await screen.findByTestId("document_detail.delete_dialog");
    expect(
      within(dialog).getByText(/permanently removed/i),
    ).toBeInTheDocument();
    expect(backend.deleteDocument).not.toHaveBeenCalled();

    await user.click(
      screen.getByTestId("document_detail.delete_confirm_button"),
    );

    await waitFor(() => {
      expect(backend.deleteDocument).toHaveBeenCalledWith(1n);
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/documents");
    });
  });
});
