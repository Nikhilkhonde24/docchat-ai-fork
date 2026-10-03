import type { AuthState } from "@/hooks/useAuth";
import { vi } from "vitest";

/**
 * Mutable auth state shared with the `vi.mock("@/hooks/useAuth")` factory in a
 * test file. Tests call `setAuth(...)` before rendering; the mocked hook reads
 * the current value on every render.
 */
export const authState: AuthState = {
  isAuthenticated: false,
  isInitializing: false,
  isLoggingIn: false,
  login: vi.fn(),
  logout: vi.fn(),
};

export function setAuth(overrides: Partial<AuthState> = {}): void {
  Object.assign(authState, {
    isAuthenticated: false,
    isInitializing: false,
    isLoggingIn: false,
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  });
}

export function resetAuth(): void {
  setAuth();
}
