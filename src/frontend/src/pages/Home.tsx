import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { Hero } from "@/components/landing/Hero";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

/**
 * Marketing landing page for the Home route. Composes the hero and the
 * three-step feature explainer, then closes with a primary call to action.
 */
export function Home() {
  const { isAuthenticated, isInitializing, isLoggingIn, login } = useAuth();

  return (
    <div data-ocid="landing.page" className="flex flex-col">
      <Hero />
      <FeatureGrid />

      <section
        data-ocid="landing.cta_section"
        className="relative overflow-hidden bg-background"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hero-glow"
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-20 md:px-6 md:py-24">
          <div className="flex flex-col items-start justify-between gap-8 border border-border bg-card p-8 md:flex-row md:items-center md:p-12">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-bold uppercase leading-tight tracking-tight text-primary text-balance md:text-4xl">
                Point it at your own documents
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Bring a PDF, ask a real question, and get an answer you can
                trace back to the page. No setup beyond signing in.
              </p>
            </div>

            {isAuthenticated ? (
              <Button
                asChild
                size="lg"
                data-ocid="landing.cta_button"
                className="shrink-0 rounded-none font-display text-sm font-bold uppercase tracking-wider"
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
                data-ocid="landing.cta_button"
                onClick={login}
                disabled={isInitializing || isLoggingIn}
                className="shrink-0 rounded-none font-display text-sm font-bold uppercase tracking-wider"
              >
                {isLoggingIn ? "Signing in…" : "Open the app"}
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
