import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { FileText, Menu, MessagesSquare, X } from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/documents", label: "Documents" },
  { to: "/chat", label: "Chat" },
] as const;

function isActive(pathname: string, to: string): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function Layout() {
  const { isAuthenticated, isInitializing, isLoggingIn, login, logout } =
    useAuth();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <Link
            to="/"
            data-ocid="nav.home_link"
            className="group flex items-center gap-2.5"
            onClick={() => setMobileOpen(false)}
          >
            <span className="flex size-7 items-center justify-center rounded-sm bg-primary font-mono text-sm font-bold text-primary-foreground">
              S
            </span>
            <span className="font-display text-lg font-bold uppercase tracking-tight text-foreground">
              Signal
            </span>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 md:flex"
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  data-ocid={`nav.${item.label.toLowerCase()}_link`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-ocid="nav.logout_button"
                onClick={logout}
                className="hidden rounded-full border-border md:inline-flex"
              >
                Sign out
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                data-ocid="nav.login_button"
                onClick={login}
                disabled={isInitializing || isLoggingIn}
                className="hidden rounded-full md:inline-flex"
              >
                {isLoggingIn ? "Signing in…" : "Sign in"}
              </Button>
            )}
            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              data-ocid="nav.menu_toggle"
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex size-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted md:hidden"
            >
              {mobileOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <nav
            aria-label="Primary mobile"
            className="border-t border-border bg-background px-4 py-3 md:hidden"
          >
            <ul className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.to);
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      data-ocid={`nav.mobile.${item.label.toLowerCase()}_link`}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-muted text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {item.label === "Documents" ? (
                        <FileText className="size-4" />
                      ) : item.label === "Chat" ? (
                        <MessagesSquare className="size-4" />
                      ) : null}
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 border-t border-border pt-3">
              {isAuthenticated ? (
                <Button
                  type="button"
                  variant="outline"
                  data-ocid="nav.mobile.logout_button"
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="w-full rounded-full border-border"
                >
                  Sign out
                </Button>
              ) : (
                <Button
                  type="button"
                  data-ocid="nav.mobile.login_button"
                  onClick={() => {
                    login();
                    setMobileOpen(false);
                  }}
                  disabled={isInitializing || isLoggingIn}
                  className="w-full rounded-full"
                >
                  {isLoggingIn ? "Signing in…" : "Sign in"}
                </Button>
              )}
            </div>
          </nav>
        ) : null}
      </header>

      <main className="flex-1 bg-background">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-4 py-8 md:flex-row md:items-center md:px-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Signal · document intelligence
          </p>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
