---
name: Cardinal Docs
description: Dark control-room identity — blue-tinted ink canvas, one ember/amber signal, evidence-first, no hype.
colors:
  background: "oklch(0.16 0.014 265)"
  foreground: "oklch(0.975 0.004 250)"
  card: "oklch(0.205 0.018 265)"
  card-foreground: "oklch(0.975 0.004 250)"
  popover: "oklch(0.205 0.018 265)"
  popover-foreground: "oklch(0.975 0.004 250)"
  primary: "oklch(0.975 0.004 250)"
  primary-foreground: "oklch(0.16 0.014 265)"
  secondary: "oklch(0.25 0.02 265)"
  secondary-foreground: "oklch(0.975 0.004 250)"
  muted: "oklch(0.25 0.02 265)"
  muted-foreground: "oklch(0.685 0.026 258)"
  accent: "oklch(0.63 0.14 38)"
  accent-foreground: "oklch(0.16 0.014 265)"
  highlight: "oklch(0.79 0.155 72)"
  mcp: "oklch(0.72 0.115 228)"
  destructive: "oklch(0.645 0.2 27)"
  destructive-foreground: "oklch(0.985 0 0)"
  border: "oklch(0.288 0.021 265)"
  input: "oklch(0.288 0.021 265)"
  ring: "oklch(0.62 0.018 262)"
  surface: "oklch(0.72 0.03 265 / 5%)"
  surface-hover: "oklch(0.72 0.03 265 / 9%)"
  hairline: "oklch(0.8 0.03 265 / 12%)"
typography:
  display:
    fontFamily: "Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.625rem, 5vw, 3.375rem)"
    fontWeight: 800
    lineHeight: 1.03
    letterSpacing: "-0.018em"
  headline:
    fontFamily: "Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4.5vw, 2.75rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  small:
    fontFamily: "Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  fine:
    fontFamily: "Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
  figure:
    fontFamily: "Figtree Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
  mono-body:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  mono-small:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  mono-micro:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.625rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.2em"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
  section: "clamp(96px, 12vw, 160px)"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "transparent"
    borderColor: "{colors.foreground} at 25%"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.card}"
    borderColor: "{colors.border}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# Design System: Cardinal Docs

Source of truth for the values above: `src/index.css` (`:root` custom properties) and `tailwind.config.js`, which maps them to semantic Tailwind utilities (`bg-background`, `text-foreground`, `border-border`, `bg-surface`, `text-accent`, `text-muted-foreground`, `text-highlight`). Change the CSS var, not the utility.

## 1. Overview

**Creative North Star: "The Control Room, lights down, signal up"**

The marketing site is the product's own identity carried to a public surface. Conductor/Maestro is a calm control room — cool near-neutral surfaces, one warm signal, evidence over adjectives. The website takes that same system and turns up the scale, not the volume: bigger type, more air, real product surfaces (the Agent Outcomes dashboard, evidence chains, outcome ledgers, live investigation) doing the persuading. A visitor should feel they are already looking at the product before they sign up.

**Dark-first.** The page base is a blue-tinted ink canvas (`background`, L 0.16, hue 265). There is no light theme; pages open `bg-background text-foreground` and separate surfaces by lightness (`surface`, `card`) rather than by inverting.

Anti-references from PRODUCT.md: no AI-hype gradient text, no legacy-vendor feature grids, no enterprise beige. Dark is the material here, but the neon-on-black terminal look is still rejected — the canvas is a tinted near-neutral, not pure black, and the signal is warm, not neon.

## 2. Colors

**The One Signal Rule (load-bearing).** `accent` (ember, hue 38) is the only saturated color that carries meaning: primary CTAs, links, focus rings, live/active state, hover marks. `highlight` (amber, hue 72) is its lighter sibling, reserved for emphasized words in headings (`.gradient-text`, `.text-signal`) and for machine-data chrome — badges and mono eyebrows over product surfaces. If accent or highlight is decorating rather than meaning, it is wrong. Status hues (green/amber/red) appear only in their semantic role — inside product imagery and outcome data, never as marketing flavor.

**The Tinted-Neutral Rule.** Every neutral leans faintly cool (hue ~258–265, chroma ≤ 0.026). No warm neutrals — no cream, sand, paper, parchment anywhere. Cool tint + warm signal is the whole palette tension; don't split the difference.

- Body text is `foreground` on every surface. `muted-foreground` is for genuinely secondary text only.
- `surface` / `surface-hover` / `hairline` are translucent overlays — use them for panels that sit *on* the canvas; `card` is the opaque step for panels that must read as a distinct object.
- `mcp` (cool blue, hue 228) is the tool-call color in product diagrams, chosen to contrast the warm LLM accent. It is a diagram token, not a brand color.
- There is no site-wide chart ramp. Data visualization on marketing pages is hand-drawn SVG using the tokens above; if a real multi-series chart lands here, port the product's ramp then rather than inventing one.

## 3. Typography

**Figtree Variable** for everything except machine data; **JetBrains Mono** for machine data. Hierarchy comes from weight and size, never a third typeface. `font-optical-sizing: auto` globally; `text-wrap: balance` on h1–h3.

- **Display** — hero statements only, at weight 800. Clamped 2.625→3.375rem: these heroes live in a half-width grid column, not full bleed, so the ceiling is set by the column rather than the viewport. Tracking floor -0.04em.
- **Headline** — section openers.
- **Title** — card and sub-section headings. There is no step between `title` and `headline`; a heading that wants "a bit bigger than title" is drift, not a role.
- **Body** — marketing prose runs 17px/1.6, capped at 65–75ch. `body` sets this as the document default so markdown prose inherits the scale.
- **Fine** — one step under `small`, for dense supporting text: pricing ranges, footnotes, the hero trust line.
- **Figure** — large numeric data (prices, counters). Display-scale, but it reads as a measurement rather than a statement, so it sits below `headline`. Pair with `tabular-nums`.
- **Mono** — strictly machine data: metric names, costs, PR numbers, log lines, install commands. On a marketing page this is a signature move: real telemetry rendered as telemetry. `mono-micro` is the chrome step — the uppercase tracked eyebrows and badges over product surfaces. It carries a 0.2em default; call sites may override tracking, and do (0.16–0.24em), but nothing below 10px.

Use the ramp utilities (`text-display`, `text-title`, `text-fine`, `text-figure`, `text-mono-micro`), which carry size, leading, tracking, and weight as one treatment. A literal `text-[Npx]` is a signal that a role is missing from the ramp, not a licence to hand-tune past it.

**No gradient text, ever.** `.gradient-text` and `.headline-ink` are historical names for what are now solid fills — keep them solid. Emphasis is weight, size, or a single highlight word.

## 4. Elevation & Layout

Tonal-first, shadow-minimal: surfaces separate by lightness steps and hairline borders, not by drop shadows. `shadow-whisper` and `shadow-seat` are the only shadows for content; heavier shadows (`shadow-2xl`) are reserved for genuinely floating layers — dropdowns and lightbox dialogs. Section rhythm comes from generous, *varied* vertical spacing (`spacing.section` as the baseline, compressed where sections are conversationally linked), not from divider lines or alternating stripes.

Cards are rationed: product evidence (screenshots, outcome ledgers) sits directly on the canvas or in a single hairline-bordered frame, not in identical icon-heading-text card grids. Nested cards prohibited.

## 5. Components

- **Buttons:** `rounded-lg`, `px-4 py-2`, `text-sm font-medium`. Primary = `bg-accent text-accent-foreground`, hover `opacity-90`. Outline = `border-foreground/25`, hover fills to accent (`hover:border-accent hover:bg-accent hover:text-accent-foreground`).
- **Focus:** global `:focus-visible` is a 2px accent outline at 3px offset. Don't remove it without replacing it with an equally visible ring.
- **Badges:** full-radius pills with soft tint fills (`border-highlight/60 bg-highlight/[0.14] text-highlight`), mono, uppercase, wide tracking — never loud solids.
- **Navigation:** slim top bar on the canvas; active/hover marked with accent; no mega-menus.
- **Product imagery:** real Conductor UI screenshots on a `rounded-xl` `border-border` frame over `bg-card/40`; click-to-zoom opens a `<dialog>` lightbox with a blurred `bg-background/85` backdrop.

## 6. Motion

Calm and intentional, matching "calm, precise, trustworthy":

- Ease-out exponential curves only (`cubic-bezier(0.16, 1, 0.3, 1)`); no bounce, no elastic.
- Content is visible by default; `.reveal` / `.animate-fade-in` are short fade-and-rise enhancements, never gates on visibility.
- Signature moments — the live investigation, the NestForge DAG, the install terminal — may be alive, but as a bounded sequence, not an indefinite pulse.
- The global `prefers-reduced-motion: reduce` block flattens all animations and transitions. Any JS-driven motion must check the same query itself; the CSS block can't reach it.

## 7. Do's and Don'ts

### Do:
- **Do** let real product surfaces and real-shaped data make the claims — evidence over adjectives.
- **Do** keep accent rare so the primary CTA is unmistakably *the* action on the page.
- **Do** use JetBrains Mono to render telemetry as telemetry — it is the site's texture.
- **Do** reach for the semantic tokens (`bg-surface`, `border-border`, `text-muted-foreground`) before writing a literal color.

### Don't:
- **Don't** use gradient text, sparkle iconography, or "revolutionize" energy — the calm is the differentiation.
- **Don't** ship hero-metric cards, identical icon card grids, or uppercase tracked eyebrows on every section.
- **Don't** use warm neutrals, pure #000, or neon-on-black.
- **Don't** use side-stripe borders, nested cards, or content shadows heavier than `shadow-seat`.
- **Don't** introduce a light-mode section; there is one canvas.
- **Don't** reintroduce the retired light-theme tokens (`cobalt`, `ink`, `canvas`, `line`, `slate-*`, `ok`/`warn`/`bad`, `chart-1..5`). They were deleted from `tailwind.config.js` once the last consumer went; a literal color is a signal you want a semantic token that doesn't exist yet.
