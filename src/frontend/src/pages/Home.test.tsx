import { authState, resetAuth, setAuth } from "@/test/auth";
import { renderApp } from "@/test/render";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => authState,
}));

describe("landing page", () => {
  beforeEach(() => {
    resetAuth();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the hero headline, subheadline, and feature highlights", async () => {
    await renderApp({ path: "/" });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /AI for Backend Developers/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Applications where users can chat with their own documents/i,
      ),
    ).toBeInTheDocument();

    const features = screen.getByTestId("landing.features_section");
    expect(within(features).getByText("Upload")).toBeInTheDocument();
    expect(within(features).getByText("Ask")).toBeInTheDocument();
    expect(within(features).getByText("Cited answers")).toBeInTheDocument();
  });

  it("prompts a signed-out visitor to sign in from the primary CTA", async () => {
    const user = userEvent.setup();
    await renderApp({ path: "/" });

    const cta = screen.getByTestId("landing.open_app_button");
    expect(cta).toHaveTextContent(/Open the app/i);

    await user.click(cta);
    expect(authState.login).toHaveBeenCalledTimes(1);
  });

  it("routes a signed-in user to the documents library from the CTA", async () => {
    const user = userEvent.setup();
    setAuth({ isAuthenticated: true });
    const { router } = await renderApp({ path: "/" });

    await user.click(screen.getByTestId("landing.open_app_button"));

    expect(router.state.location.pathname).toBe("/documents");
  });
});
