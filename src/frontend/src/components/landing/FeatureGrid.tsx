import { FileUp, MessageSquareText, Quote } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  step: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const FEATURES: Feature[] = [
  {
    step: "01",
    title: "Upload",
    description:
      "Drop in a PDF and the backend extracts, chunks, and indexes the text. No preprocessing, no glue code — the document is ready to query in seconds.",
    icon: FileUp,
  },
  {
    step: "02",
    title: "Ask",
    description:
      "Ask a question in plain language. Retrieval finds the passages that matter and the model answers from those passages, not from guesswork.",
    icon: MessageSquareText,
  },
  {
    step: "03",
    title: "Cited answers",
    description:
      "Every answer carries numbered citations back to the exact source page, so you can verify the claim before you trust it.",
    icon: Quote,
  },
];

/**
 * Three-step explainer for the upload → ask → cited answers flow. Editorial
 * grid with hairline dividers and mono step numerals.
 */
export function FeatureGrid() {
  return (
    <section
      id="how-it-works"
      data-ocid="landing.features_section"
      className="border-b border-border bg-background"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-20 md:px-6 md:py-24">
        <div className="max-w-2xl">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-primary">
            How it works
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold uppercase leading-tight tracking-tight text-foreground text-balance md:text-4xl">
            From raw document to a verifiable answer
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Three steps, one loop. Upload the source, ask the question, and read
            the answer with its evidence attached.
          </p>
        </div>

        <ol className="mt-14 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <li
                key={feature.step}
                data-ocid={`landing.feature.${feature.step}`}
                className="group flex flex-col bg-card p-7 transition-colors hover:bg-muted/40 md:p-8"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center border border-border bg-background text-primary transition-colors group-hover:border-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-mono text-2xl font-bold text-border transition-colors group-hover:text-primary/40">
                    {feature.step}
                  </span>
                </div>

                <h3 className="mt-6 font-display text-xl font-bold uppercase tracking-tight text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
