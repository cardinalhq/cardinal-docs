---
target: docs home + shell
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-05T20-39-10Z
slug: content-index-mdx
---
⚠️ DEGRADED: single-context (three sub-agents ran but none delivered a report; transcripts unrecoverable — Assessment A re-run inline, Assessment B's detector output recovered from disk and re-verified)

# Critique: Cardinal docs home + shell

Target: `content/index.mdx` + `app/layout.tsx` (Nextra shell). Mode: **Read**.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Breadcrumbs, active sidebar state, "Last updated on", live TOC highlight all present. Nothing signals the Quick Start exists. |
| 2 | Match System / Real World | 3 | Domain language is correct throughout; Cardinal-brand vs `lakerunner`-identifier split handled well. Home-page register misses the audience. |
| 3 | User Control and Freedom | 3 | Standard docs nav, breadcrumbs, Copy-page control. Nothing traps the reader. |
| 4 | Consistency and Standards | 2 | 113 distinct literal colors across 10 CSS modules, no shared token layer; DESIGN.md describes a different site entirely. |
| 5 | Error Prevention | 2 | The home page's "Quick Start to get you going:" promises a link that does not exist — it actively misleads. |
| 6 | Recognition Rather Than Recall | 2 | 130 sidebar `<li>` rendered on the home page; 15 flat Integrations siblings, 12 flat Data Lake siblings. The Quick Start is pure recall — hidden from nav, unlinked from body. |
| 7 | Flexibility and Efficiency | 3 | ⌘K Pagefind search, Copy-page-as-markdown, full keyboard nav. Genuinely good for a returning reader. |
| 8 | Aesthetic and Minimalist Design | 2 | The home page is not minimal, it is *empty*: 502 characters of body copy above a large dead zone. |
| 9 | Error Recovery | 3 | 404 page uses plain language and carries the pre-hydration legacy-URL redirect. No search offered from the 404. |
| 10 | Help and Documentation | 3 | It *is* the documentation; `SupportCallout` gives a real escape hatch with a real address. |
| **Total** | | **26/40** | **Acceptable — significant improvements needed** |

## Design Specificity Verdict

**LLM assessment.** This is stock Nextra with a mascot and an orange variable. The Cardinal identity in this shell amounts to three gestures: the chip logo in the navbar, `--cardinal-accent` orange on links, and a 3px orange left-stripe on every `<h2>`. Strip those and nothing distinguishes it from any other Nextra site on the internet. That verdict is harsher on the shell than on the content — the interior pages (`/data-lake/install` in particular) are genuinely well-authored, with a clear recommendation callout, real prerequisites, and a numbered task TOC. The craft is in the MDX, not in the design system.

Worth calling out honestly: the one deliberate brand gesture, the `<h2>` side-stripe in `styles/globals.css`, is a move the project's own DESIGN.md explicitly forbids ("Don't use side-stripe borders"). The detector independently flagged a `side-tab` warning. But DESIGN.md here is a byte-identical copy of the *marketing site's* record — dark-only, Tailwind, OKLCH tokens — describing a site this repo is not. The stripe is not really a violation; the design record is simply the wrong oracle. That is the finding.

**Deterministic scan.** `detect.mjs` over `app content components mdx-components.tsx`: exit 2, **379 findings** — 378 advisory, 1 warning.

| Rule | Count |
|---|---|
| `design-system-color` | 335 |
| `design-system-font-size` | 22 |
| `design-system-radius` | 21 |
| `side-tab` | 1 |

Concentrated in: `LakerunnerHelmValuesWizard.module.css` (123), `SizingEstimator.module.css` (92), `diagrams/Diagram.module.css` (63), `QuerySizingEstimator.module.css` (54).

**Large-scale false positive, stated plainly.** Nearly all 379 are "outside DESIGN.md" — measured against a DESIGN.md that documents the marketing site. As *stated*, they are noise. Cross-referencing turns up the real signal underneath:

- **113 distinct literal colors** across 10 CSS modules, against **6** shared tokens in `styles/globals.css`.
- Dark-mode twins are hand-maintained per file. `diagrams/Diagram.module.css` carries 46 literal colors against 19 `.dark` blocks; `counters.module.css` has a literal color and **no** dark handling at all.

So the colors are not broken in dark mode — I checked, they largely pair up. The defect is that theme correctness is maintained by hand in ten places with no shared vocabulary, which is how it *becomes* broken.

**Visual overlays.** Not available. Assessment B reported a completed injection run on four pages before it was lost, but no overlay is live in a browser tab now and I will not claim one is.

## Overall Impression

The interior documentation is better than the front door by a wide margin. `/data-lake/install` knows exactly who it is talking to. The home page does not: 502 characters, a greeting emoji, a promise of a Quick Start that goes nowhere, and a heading that says "Cardinal Documentation" to a reader who already knows they are in the Cardinal documentation.

The single biggest opportunity is the home page. It is the one surface where PRODUCT.md's two confirmed readers diverge — one is going to Data Lake install, the other to UI integrations — and right now it routes neither. It hands both a 130-item sidebar and wishes them luck.

## What's Working

1. **`/data-lake/install` is a model install page.** It opens with a recommendation ("We recommend the operator for every install"), names the alternative and its cost ("you own upgrades and monitoring"), then gates on real prerequisites before any command. That ordering respects a reader who is about to run helm against production.
2. **Accessibility fundamentals are actually there.** Skip-to-content link, real `<main>` landmark, clean H1→H2 order, fonts resolving correctly to Figtree/JetBrains Mono. Not glamorous, quietly correct.
3. **The reference ergonomics are strong.** ⌘K search, Copy-page-as-markdown (well-judged for a docs site whose readers pipe pages into coding agents), breadcrumbs, live TOC. Heuristic 7 is the site's best score for a reason.

## Priority Issues

**[P1] The home page breaks its own promise.**
`content/index.mdx:7` reads "New to Cardinal? We've got you covered, with a simple Quick Start to get you going:" — and the colon is followed by an "Our Products" heading. There is no Quick Start link. `content/data-lake/_meta.ts` sets `quickstart: { display: 'hidden' }`, so the page exists at `/data-lake/quickstart`, is absent from the sidebar, and is unlinked from the body. It is unreachable except by typing the URL.
*Why it matters:* the first promise the site makes to a first-time reader is one it does not keep, and the page best suited to PRODUCT.md's stated goal ("unblocked install, unaided") is orphaned.
*Fix:* link the Quick Start from that sentence, or drop the promise. If Quick Start is the intended on-ramp, unhide it in `_meta.ts` and make it the primary call on the home page.
*Suggested command:* `/impeccable clarify`

**[P1] The home page routes nobody.**
502 characters of body copy; the whole decision is two bullets in body-sized text under an H1 that says "Cardinal Documentation". PRODUCT.md names two readers with two different destinations; neither gets a path.
*Why it matters:* the home page is where the two audiences split. Making that split invisible pushes the work onto a 130-item sidebar.
*Fix:* make the two-product choice the largest thing on the page — two real entry cards with the reader's job on them ("Stand up the Data Lake in your cloud" / "Configure Cardinal UI integrations"), not link-colored list items. Add the third door for How-To Guides, which the body never mentions.
*Suggested command:* `/impeccable layout`

**[P1] The sidebar is a wall of options.**
130 `<li>` rendered on the home page; ~22 visible at 1440×900. Integrations is a flat list of 15 siblings; Data Lake is a flat 12; UI Install is 7. All three top sections auto-expand.
*Why it matters:* four-plus items per group exceeds working memory; at fifteen, a reader stops reading and starts ⌘F-ing. It fails the chunking, minimal-choices, and progressive-disclosure checks simultaneously.
*Fix:* group Integrations by kind (Ticketing / Chat / Data Warehouse / Infrastructure) — 15 becomes 4 groups. Collapse non-active top-level sections by default so the home page does not render the Data Lake's full twelve.
*Suggested command:* `/impeccable distill`

**[P2] There is no docs design system, and DESIGN.md documents someone else's.**
113 literal colors, 10 modules, 6 shared tokens, hand-maintained dark twins, `counters.module.css` with no dark handling.
*Why it matters:* every new component starts by inventing a gray. The detector cannot help because its oracle describes a different site, so 379 findings are unreadable as signal.
*Fix:* run `/impeccable document` to replace DESIGN.md with this repo's real system, then lift the recurring grays and radii into `styles/globals.css` tokens.
*Suggested command:* `/impeccable document`

**[P2] Home-page voice misses the confirmed reader.**
"Hello, and welcome! 👋" and "We've got you covered" against a brand voice committed to "calm, precise, trustworthy — a senior engineer explaining something real," addressed to someone mid-install with a half-written values file.
*Why it matters:* it is the one place the docs sound like a template rather than like Cardinal, and it is the first thing anyone reads.
*Fix:* open with what the reader can do and where to go, in the register `/data-lake/install` already uses.
*Suggested command:* `/impeccable clarify`

## Persona Red Flags

**Alex (Impatient Power User):** Lands on `/`, finds 502 characters and no command. The fastest real path — Quick Start — is hidden from the sidebar and unlinked, so Alex cannot find it even deliberately. Recovers via ⌘K, which works well; the home page contributed nothing. Copy-page-as-markdown is the one feature that will make Alex stay.

**Jordan (Confused First-Timer):** Reads "a simple Quick Start to get you going:" carefully, as Jordan does, and finds nothing after the colon. Then must choose between "Cardinal UI" and "Cardinal Data Lake" from one-line descriptions, with no guidance on which they need or whether they need both. Sidebar offers 22 more choices. This is the abandonment point.

**Casey (Distracted Mobile User):** Layout is genuinely responsive — no horizontal scroll, readable, sensible tap targets. But `content/index.mdx:14` says "Existing Cardinal customers can find more detailed documentation in the sidebar," and on a 390px viewport there *is* no sidebar; it is behind an unlabeled hamburger. The copy references a UI element that is not on screen.

**Project persona — "Priya," the mid-install platform engineer (from PRODUCT.md):** Arrives from a search result deep in `/data-lake/`, not at `/`. For her the home page is irrelevant and the interior pages are strong — this is the reader the site actually serves well today. Her risk is the sidebar: with `Architecture`, `CLI Reference`, and `App Instrumentation` as peers of `Installation` in one flat twelve, the install path does not read as a path.

## Minor Observations

- "On This Page" on the home page lists exactly one entry ("Our Products") — a TOC with one item is visual noise; suppress it under a threshold.
- The home page's dead zone is large: content ends near 550px, footer sits near 870px, on a 1021px document.
- The `<h2>` left-stripe is applied globally in `article h2`, including on single-H2 pages like the home page, where it decorates rather than divides.
- The `N` circle at bottom-left overlapping the theme-toggle label is the Next.js dev indicator, not a production defect — noted so it is not mistaken for one.
- `content/index.mdx` never mentions How-To Guides, though it is one of four top-level sections.

## Questions to Consider

1. If a reader lands on `/` and leaves 8 seconds later having clicked exactly one thing, what should that thing have been? The page currently has no answer.
2. Why is Quick Start hidden? If it is not good enough to show, why does the home page promise it — and if it is, why is it the only page in the tree that is unreachable by navigation?
3. What would the sidebar look like if it were designed for someone who already knows what they want, rather than for completeness?
4. The interior pages are markedly better than the shell. Is the shell worth designing at all, or should the home page simply become three doors and get out of the way?
