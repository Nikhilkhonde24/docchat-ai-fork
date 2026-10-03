import { asBackend, createMockBackend } from "@/test/actor";
import { authState, resetAuth, setAuth } from "@/test/auth";
import { renderApp } from "@/test/render";
import { screen, within } from "@testing-library/react";
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

describe("top navigation", () => {
  beforeEach(() => {
    resetAuth();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("links Home, Documents, and Chat and marks the active route", async () => {
    const user = userEvent.setup();
    setAuth({ isAuthenticated: true });
    const { router } = await renderApp({ path: "/" });

    // The brand logo also carries nav.home_link, so scope to the primary nav.
    const primaryNav = screen.getByRole("navigation", { name: "Primary" });
    const home = within(primaryNav).getByTestId("nav.home_link");
    const documents = within(primaryNav).getByTestId("nav.documents_link");
    const chat = within(primaryNav).getByTestId("nav.chat_link");

    expect(home).toHaveAttribute("aria-current", "page");
    expect(documents).not.toHaveAttribute("aria-current");
    expect(chat).not.toHaveAttribute("aria-current");

    await user.click(documents);
    expect(router.state.location.pathname).toBe("/documents");
    expect(
      within(primaryNav).getByTestId("nav.documents_link"),
    ).toHaveAttribute("aria-current", "page");
    expect(within(primaryNav).getByTestId("nav.home_link")).not.toHaveAttribute(
      "aria-current",
    );

    await user.click(chat);
    expect(router.state.location.pathname).toBe("/chat");
    expect(within(primaryNav).getByTestId("nav.chat_link")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("keeps the Documents nav item active on a document detail route", async () => {
    setAuth({ isAuthenticated: true });
    await renderApp({ path: "/documents/1" });

    expect(screen.getByTestId("nav.documents_link")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
