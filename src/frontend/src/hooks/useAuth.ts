import { useInternetIdentity } from "@caffeineai/core-infrastructure";

export interface AuthState {
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoggingIn: boolean;
  login: () => void;
  logout: () => void;
}

/**
 * Thin wrapper over the platform Internet Identity context so pages and the
 * shared layout share one auth surface.
 */
export function useAuth(): AuthState {
  const { isAuthenticated, isInitializing, isLoggingIn, login, clear } =
    useInternetIdentity();

  return {
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    login: () => login(),
    logout: () => clear(),
  };
}
