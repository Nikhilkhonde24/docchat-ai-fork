import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "@tanstack/react-router";
import { ArrowRight, FileText, MessagesSquare, Quote } from "lucide-react";

/**
 * Full-bleed editorial hero. Absolute black canvas, one electric yellow
 * headline, and a primary CTA that routes signed-in users to Documents and
 * prompts signed-out visitors to sign in.
 */
export function Hero() {
  const { isAuthenticated, isInitializing, isLoggingIn, login } = useAuth();

  const ctaDisabled = isInitializing || isLoggingIn;

  return (
    <section
      data-ocid="landing.hero_section"
      className="relative overflow-hidden border-b border-border bg-background"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hero-glow"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 grid-noise opacity-60"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-20 md:px-6 md:py-28 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
          <div className="min-w-0">
            <p className="mb-6 inline-flex items-center gap-2 border border-border bg-card px-3 py-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              Retrieval-augmented answers
            </p>

            <h1 className="font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight text-primary text-balance sm:text-6xl lg:text-7xl">
              AI for Backend Developers
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/90 text-balance md:text-xl">
              Applications where users can chat with their own documents.
            </p>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Upload a PDF, ask a question in plain language, and get an answer
              grounded in the source — every claim traced back to the exact page
              it came from.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              {isAuthenticated ? (
                <Button
                  asChild
                  size="lg"
                  data-ocid="landing.open_app_button"
                  className="rounded-none font-display text-sm font-bold uppercase tracking-wider"
                >
                  <Link to="/documents">
                    Open the app
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  data-ocid="landing.open_app_button"
                  onClick={login}
                  disabled={ctaDisabled}
                  className="rounded-none font-display text-sm font-bold uppercase tracking-wider"
                >
                  {isLoggingIn ? "Signing in…" : "Open the app"}
                  <ArrowRight className="size-4" />
                </Button>
              )}

              <Button
                asChild
                variant="outline"
                size="lg"
                data-ocid="landing.learn_more_button"
                className="rounded-none border-border font-display text-sm font-bold uppercase tracking-wider"
              >
                <a href="#how-it-works">See how it works</a>
              </Button>
            </div>

            {!isAuthenticated ? (
              <p className="mt-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Sign in to upload documents and start chatting
              </p>
            ) : null}
          </div>

          <div className="min-w-0">
            <div className="border border-border bg-card shadow-lg">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-muted-foreground">
                  answer · grounded
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-primary">
                  <span className="size-1.5 rounded-full bg-primary" />
                  live
                </span>
              </div>

              <div className="space-y-5 p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center border border-border bg-muted text-muted-foreground">
                    <MessagesSquare className="size-3.5" />
                  </span>
                  <p className="text-sm leading-relaxed text-foreground">
                    How does the ingestion pipeline handle a 400-page spec?
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center bg-primary text-primary-foreground">
                    <Quote className="size-3.5" />
                  </span>
                  <div className="min-w-0 space-y-3">
                    <p className="text-sm leading-relaxed text-foreground/90">
                      The pipeline chunks on section boundaries, embeds each
                      chunk, and stores the page offset so answers can cite the
                      source directly.
                      <span className="citation-chip ml-1.5 align-middle">
                        1
                      </span>
                      <span className="citation-chip ml-1 align-middle">4</span>
                    </p>
                    <div className="flex items-center gap-2 border border-border bg-background px-3 py-2">
                      <FileText className="size-3.5 shrink-0 text-primary" />
                      <span className="truncate font-mono text-xs text-muted-foreground">
                        architecture-spec.pdf · p.12
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
