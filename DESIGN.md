---
name: Cardinal Docs
description: Nextra docs shell in both themes, carrying the Cardinal ember as the one signal — reference-first, terminal-adjacent, out of the reader's way.
colors:
  cardinal-accent: "oklch(0.62 0.19 36)"
  cardinal-accent-dark: "oklch(0.72 0.16 40)"
  cardinal-accent-soft: "color-mix(in oklab, oklch(0.62 0.19 36) 18%, transparent)"
  cardinal-accent-soft-dark: "color-mix(in oklab, oklch(0.72 0.16 40) 22%, transparent)"
  cardinal-orange: "oklch(0.62 0.19 36)"
  cardinal-orange-dark: "oklch(0.72 0.16 40)"
  cardinal-red: "oklch(0.58 0.22 27)"
  cardinal-red-dark: "oklch(0.68 0.19 27)"
  cardinal-amber: "oklch(0.72 0.17 65)"
  cardinal-amber-dark: "oklch(0.79 0.155 72)"
  cardinal-gold: "oklch(0.79 0.155 72)"
  cardinal-gold-dark: "oklch(0.84 0.14 78)"
typography:
  body:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  title:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  label:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  small:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  fine:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  mono-body:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  circle: "50%"
  full: "999px"
components:
  link:
    textColor: "{colors.cardinal-accent}"
  link-hover:
    textColor: "{colors.cardinal-red}"
  code-inline:
    borderColor: "{colors.cardinal-accent-soft}"
  control:
    rounded: "{rounded.sm}"
    typography: "{typography.label}"
  panel:
    rounded: "{rounded.md}"
    typography: "{typography.body}"
---

# Design System: Cardinal Docs

Source of truth for the values above: `styles/globals.css`, which declares the `--cardinal-*` custom properties on `:root` and re-declares them under `.dark`. There is no Tailwind in this repo — the shell is `nextra-theme-docs`, and everything else is CSS Modules (`components/*.module.css`). Change the CSS var, not the call site.

The tokens above are only what this repo actually declares — the accent family, the type steps its components use, and its radius scale. Canvas, body text, borders, and code-block color are deliberately absent because `nextra-theme-docs` owns them; they are not this repo's to define. The `-dark` suffixed color entries are the `.dark` re-declarations, listed so the pairing is machine-visible.

## 1. Overview

**Creative North Star: "The Control Room, lights down, signal up"**

The docs are the same control room with the lights up. The marketing site argues; this site is read by someone mid-install with a terminal open beside it, so the identity is carried in details — the ember accent, the mono for machine data, the chip mark — while the reading surface stays out of the way. Where the marketing site turns up the scale, the docs turn it down: default type sizes, tight components, no hero anything.

**Both themes, theme-agnostic.** Unlike the marketing site, this one has no single canvas. `nextra-theme-docs` owns background, text, border, and code-block colors in both light and dark, and the reader picks via the footer toggle. Nothing here may assume a dark base. Every color a component introduces needs its `.dark` counterpart in the same file, or it breaks for half the readers.

Anti-references, inherited: no AI-hype gradient text, no legacy-vendor feature grids, no enterprise beige, no neon-on-black terminal look. Added for docs: no marketing furniture on a reference page — no hero bands, no CTA cards, no testimonial pull-quotes between the reader and the command they came for.

## 2. Colors

**What is actually wired up.** `styles/globals.css` declares six variables — `--cardinal-orange`, `--cardinal-red`, `--cardinal-amber`, `--cardinal-gold`, `--cardinal-accent`, `--cardinal-accent-soft` — on `:root`, then re-declares all six under `.dark` at a higher lightness so the ember stays legible on Nextra's dark canvas. That per-theme pair is the pattern every color in this repo should follow.

**The One Signal Rule (load-bearing).** `--cardinal-accent` (ember) is the only saturated color that carries meaning: links, the `<h2>` rule, code-block borders, selection. Everything else on a docs page is Nextra's neutral. If the accent is decorating rather than meaning, it is wrong.

**The Theme-Pair Rule.** Every color declared in this repo needs a `.dark` counterpart in the same file. There is no canvas to assume, and a value tuned for one theme is invisible or glaring in the other. `components/counters.module.css` is the standing violation: one literal color, no dark rule.

**Known drift.** Against these 6 shared tokens the repo carries **113 distinct literal colors** across 10 CSS modules — a hand-copied gray scale (`#333`, `#e5e5e5`, `#999`, `#666`, `#1a1a1a`) plus a hardcoded `#ff5722` orange in 22 places that duplicates `--cardinal-accent` instead of referencing it. Heaviest: `LakerunnerHelmValuesWizard.module.css` (45), `diagrams/Diagram.module.css` (46 colors against only 19 dark rules), `SizingEstimator.module.css` (24). New work references the vars; consolidating the existing literals is tracked debt.

- Canvas, body text, borders, and code-block colors belong to `nextra-theme-docs`. Don't restate them.
- Status hues (green/amber/red) appear only in their semantic role inside diagrams and estimator output, never as flavor.
- There is no chart ramp. Diagrams are hand-drawn SVG/CSS in `components/diagrams/`; if a real multi-series chart lands here, port the product's ramp rather than inventing one.

## 3. Typography

**Figtree** for everything except machine data; **JetBrains Mono** for machine data. Both load via `next/font/google` in `app/layout.tsx` and are exposed as `--font-sans` and `--font-mono`. `styles/globals.css` binds `--font-sans` to `html` and `--font-mono` to `code, pre, kbd, samp` — that binding is the whole typographic contract. Hierarchy comes from weight and size, never a third typeface.

**Nextra owns the prose scale.** Unlike the marketing site, this repo has no type ramp of its own: heading sizes, body measure, and code-block type all come from `nextra-theme-docs`. The marketing ramp's display roles (`display`, `headline`, `figure`, `mono-micro`) have no call sites here and are deliberately absent from the frontmatter — don't reach for them, and don't restyle Nextra's headings to reproduce them.

What this repo actually sets is component type, inside `components/*.module.css`:

- **Component body** — 0.9rem is the dominant step (18 uses), with 0.85rem (14) just under it for dense wizard rows and 0.8rem / 0.75rem for helper text.
- **Component headings** — weight 600 is the default emphasis (22 uses), 500 for the softer step (14). Weights above 700 are one-offs and should not spread.
- **Mono** — strictly machine data: metric names, log lines, install commands, generated YAML. On a docs page this is not a signature move, it is literal: the reader is going to copy it.

**Do not hand-tune past the two steps.** The 0.9/0.85rem pair plus weight 500/600 covers essentially every component in the repo. A third size in a new module is drift unless it earns a documented role.

**No gradient text, ever.** Emphasis is weight, size, or the accent color — never a gradient fill.

## 4. Elevation & Layout

Borders do the work, not shadows — and the code agrees: the entire repo carries **three** `box-shadow` declarations. Two are the same lifted-panel treatment written twice for the two themes (`0 18px 40px rgba(2, 6, 23, 0.6)` dark, `rgba(15, 23, 42, 0.12)` light); the third is a 2px error ring. Everything else separates by a 1px border and a background step. Keep it that way: a new shadow needs a reason a border cannot serve.

Layout is Nextra's: fixed sidebar, centered content column, right-hand TOC, and its own breakpoints. This repo does not set page rhythm — there is no `spacing.section` here. What it does set is the density *inside* components, and that density is tight: wizard rows, estimator tables, and connector cards are meant to be scanned beside a terminal, not scrolled through.

Cards are rationed. The reference content is prose, code, and tables; a card is for a genuinely separable object (a connector, an estimator panel, a callout). Nested cards prohibited.

## 5. Components

There is no button/badge component library here — Nextra supplies the shell, and this repo's components are documentation instruments. Radius is the one shared shape signal: **6px** (16 uses) for controls and small chrome, **8px** (14 uses) for panels and cards. `50%` for avatars/dots and `999px` for pills are the only sanctioned exceptions; the stray 1px/3px/5px/14px values in `HowTo.module.css` and `SizingEstimator.module.css` are drift.

- **Links and headings:** `article a` is `var(--cardinal-accent)`, underline-free, hovering to `var(--cardinal-red)`. `article h2` carries the 3px accent side-rule. `article code` borders in `--cardinal-accent-soft`, and `::selection` fills with it. These four rules in `styles/globals.css` are the entire brand surface of a docs page.
- **Navigation:** `nextra-theme-docs` owns it — navbar with the chip mark, collapsible sidebar from `_meta.ts`, right-hand TOC, ⌘K Pagefind search. Don't hand-roll nav; change `_meta.ts`.
- **Interactive instruments** (`LakerunnerHelmValuesWizard`, `CollectorManifestsWizard`, `SizingEstimator`, `QuerySizingEstimator`, `QuickStartSteps`): these are the signature components. They are forms whose output the reader pastes into production, so correctness of the generated text outranks every visual consideration. Label every control, keep them keyboard-operable, and never let styling obscure which value is live.
- **Product imagery:** `ExpandableImage` — click-to-zoom into a fixed `rgba(0,0,0,0.8)` overlay at `z-index: 9999`. Known gap: it is a plain `div`, not a `<dialog>`, so it has no Esc handler, no focus trap, and no keyboard path in or out. Treat as a defect to fix, not a pattern to copy.
- **Focus:** whatever Nextra provides. This repo adds no `:focus-visible` rule of its own — if a component introduces a custom control, it owns giving it a visible focus ring.

## 6. Motion

Calm and intentional, matching "calm, precise, trustworthy". Docs motion is functional only — state feedback on controls, never storytelling.

- Transitions are short and property-scoped. The repo's habit is `all 0.2s` / `all 0.15s`; prefer naming the property (`border-color 0.2s`, `background 0.2s`) so a transition never animates layout by accident.
- There is no shared easing token here. Browser default easing over these durations is fine; don't import the marketing site's exponential curve for a 150ms hover.
- Content is visible by default. The only two keyframes in the repo (`pulse`, `fadeUp` in `HowTo.module.css`) are decoration on already-rendered content — motion must never gate visibility on a page someone is reading mid-install.
- **Known gap: there is no `prefers-reduced-motion` rule anywhere in this repo.** PRODUCT.md commits to a reduced-motion path for every animation, and the two keyframes above currently have none. Any new motion must ship with the query, and the existing two need it retrofitted.

## 7. Do's and Don'ts

### Do:
- **Do** let the working command, manifest, or diagram carry the page — evidence over adjectives, same as the marketing site, but here the evidence is the reader's own YAML.
- **Do** keep accent rare. On a docs page it marks links, the active nav item, and the `<h2>` rule — nothing else competes with the code blocks.
- **Do** use JetBrains Mono for machine data only (`--font-mono`, set on `code, pre, kbd, samp`). It is the site's texture.
- **Do** reach for `var(--cardinal-accent)` and its siblings before writing a literal color, and let `nextra-theme-docs` own canvas, text, border, and code-block color.
- **Do** pair every new literal color with a `.dark` override in the same module. `components/counters.module.css` is the counter-example — one hardcoded color, no dark rule.

### Don't:
- **Don't** use gradient text, sparkle iconography, or "revolutionize" energy — the calm is the differentiation.
- **Don't** ship marketing furniture on a reference page: hero bands, CTA cards, icon grids, or uppercase tracked eyebrows on every section.
- **Don't** use warm neutrals, pure #000, or neon-on-black.
- **Don't** assume a dark canvas. There is no single base here; both themes ship, and a color that only works in one is a defect.
- **Don't** invent a new gray. The repo already carries 113 distinct literal colors across 10 CSS modules against 6 shared tokens — that drift is the known debt, not a pattern to extend.
- **Don't** nest cards, or reach past a subtle resting shadow for content.

**The one sanctioned side-stripe.** The marketing system forbids side-stripe borders. This repo makes exactly one exception: the 3px accent rule on `article h2` in `styles/globals.css`, which is the docs' main brand gesture. It is a global rule on one element — do not spread the pattern to cards, callouts, or panels.
