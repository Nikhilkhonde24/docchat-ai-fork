# Design Brief

## Direction

Signal — a near-black, high-contrast document-intelligence workspace where one electric yellow carries the entire brand voice.

## Tone

Editorial brutalist for developers: confident, technical, and deliberately restrained — no gradients-as-decoration, no second accent color, no soft pastel comfort.

## Differentiation

A single hue does all the work — yellow appears only as headline ink, active state, and citation chips, so every yellow mark reads as "the answer" against absolute black.

## Color Palette

| Token      | OKLCH         | Role                                    |
| ---------- | ------------- | --------------------------------------- |
| background | 0.13 0.003 96 | Absolute-black canvas (dark mode primary) |
| foreground | 0.98 0.003 96 | White body text, AA+ on background      |
| card       | 0.175 0.004 96 | Raised surfaces, doc tiles, chat panel |
| primary    | 0.87 0.19 96  | Electric yellow — CTAs, headlines, ring |
| accent     | 0.87 0.19 96  | Same yellow, reserved for active/citation |
| muted      | 0.22 0.004 96 | Inactive chips, secondary buttons, bars |
| border     | 0.26 0.005 96 | Hairline dividers and card outlines     |

## Typography

- Display: Space Grotesk — uppercase hero headlines, section titles, wordmark
- Body: General Sans — paragraphs, UI labels, nav, buttons
- Mono: Geist Mono — citation markers, file metadata, version labels
- Scale: hero `text-5xl md:text-7xl font-bold tracking-tight uppercase`, h2 `text-3xl md:text-5xl font-bold tracking-tight`, label `text-xs font-semibold tracking-[0.2em] uppercase font-mono`, body `text-base md:text-lg`

## Elevation & Depth

Flat by default — depth comes from layered near-black surfaces, 1px hairline borders, and a single soft `shadow-elevated` on floating chat/upload panels; never glow or neon.

## Structural Zones

| Zone    | Background        | Border      | Notes                                                |
| ------- | ----------------- | ----------- | ---------------------------------------------------- |
| Header  | `bg-background/80` + blur | `border-b` | Sticky, wordmark white, active nav link yellow |
| Content | `bg-background`   | —           | Alternate `bg-card` / `bg-muted/30` sections; dot-grid noise behind hero |
| Footer  | `bg-muted/40`     | `border-t`  | Mono version label, muted links                      |
| Sidebar | `bg-sidebar`      | `border-r`  | Document list + chat history, active row yellow bar  |

## Spacing & Rhythm

Generous section padding (`py-20 md:py-28`), tight content grouping (`gap-3`/`gap-6`), micro-spacing `p-4` inside cards — spacious at the page level, dense inside the workspace.

## Component Patterns

- Buttons: primary = yellow pill, black text, hover to `bg-primary/90` + slight lift; secondary = transparent with white hairline border, hover to `bg-muted`
- Cards: `rounded-md` (6px), `bg-card`, hairline border, no shadow until hover
- Badges: mono uppercase pill; yellow for citations/active, `bg-muted` for file-type tags (PDF/TXT/MD)
- Citation chip: `.citation-chip` utility — yellow square, black mono numeral, `animate-citation-pop` on reveal

## Motion

- Entrance: single `fade-up` storyboard — hero and sections rise 12px + fade over 300ms ease-out, staggered ~60ms
- Hover: 150ms color/border transitions; cards lift with `shadow-elevated`
- Decorative: slow `pulse-soft` on the "processing" status dot; `citation-pop` on citation chip reveal

## Constraints

- Yellow is the ONLY chromatic accent — everything else is black, white, or neutral gray
- Dark mode is the intended experience; light mode exists for completeness, not parity
- No DOCX/PPTX affordances and no "chat all" control anywhere in the UI
- Body text must hold 4.5:1 contrast; yellow never used for long-form body copy

## Signature Detail

The citation chip — a small mono numeral in a yellow square that anchors every AI answer to its source passage, turning "trust" into a visible, clickable design element.
