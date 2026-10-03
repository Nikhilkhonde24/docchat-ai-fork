import { FileType } from "@/backend";
import { asBackend, createMockBackend, makeDocumentView } from "@/test/actor";
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

describe("documents library", () => {
  beforeEach(() => {
    resetAuth();
    vi.clearAllMocks();
    backend.listDocuments.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("prompts a signed-out visitor to sign in before uploading", async () => {
    await renderApp({ path: "/documents" });

    expect(
      screen.getByTestId("documents.upload_signed_out"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Sign in to upload/i)).toBeInTheDocument();
    expect(screen.queryByTestId("documents.grid")).not.toBeInTheDocument();
  });

  it("shows the first-time empty state when the library has no documents", async () => {
    setAuth({ isAuthenticated: true });
    await renderApp({ path: "/documents" });

    const empty = await screen.findByTestId("documents.empty_state");
    expect(within(empty).getByText(/No documents yet/i)).toBeInTheDocument();
    expect(
      within(empty).getByText(/Upload your first PDF, TXT, or Markdown file/i),
    ).toBeInTheDocument();
  });

  it("renders each document with its name, type, size, and status", async () => {
    setAuth({ isAuthenticated: true });
    backend.listDocuments.mockResolvedValue([
      makeDocumentView({
        id: 7n,
        name: "architecture-spec.pdf",
        fileType: FileType.pdf,
        sizeBytes: 2048n,
        status: { __kind__: "ready", ready: null },
      }),
    ]);

    await renderApp({ path: "/documents" });

    const grid = await screen.findByTestId("documents.grid");
    expect(within(grid).getByText("architecture-spec.pdf")).toBeInTheDocument();
    expect(within(grid).getByText("PDF")).toBeInTheDocument();
    expect(within(grid).getByText(/2\.0 KB/)).toBeInTheDocument();
    expect(within(grid).getByText(/Ready/i)).toBeInTheDocument();
  });

  it("reflects the name search in the page URL and the backend filter", async () => {
    const user = userEvent.setup();
    setAuth({ isAuthenticated: true });
    const { router } = await renderApp({ path: "/documents" });

    await user.type(screen.getByTestId("documents.search_input"), "spec");

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({ q: "spec" });
    });
    await waitFor(() => {
      expect(backend.listDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ nameContains: "spec" }),
      );
    });
  });

  it("applies a file-type filter from the URL to the backend query", async () => {
    setAuth({ isAuthenticated: true });
    await renderApp({ path: "/documents?type=pdf" });

    await waitFor(() => {
      expect(backend.listDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ fileType: FileType.pdf }),
      );
    });
    expect(screen.getByTestId("documents.file_type_select")).toHaveTextContent(
      "PDF",
    );
  });

  it("shows a filtered empty state with a clear-filters action", async () => {
    const user = userEvent.setup();
    setAuth({ isAuthenticated: true });
    const { router } = await renderApp({ path: "/documents?q=missing" });

    const empty = await screen.findByTestId("documents.empty_state");
    expect(
      within(empty).getByText(/No matching documents/i),
    ).toBeInTheDocument();

    await user.click(screen.getByTestId("documents.empty_clear_button"));

    await waitFor(() => {
      expect(router.state.location.search).not.toMatchObject({ q: "missing" });
    });
  });
});
