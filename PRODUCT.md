# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two confirmed primary readers, both practitioners, both arriving mid-task:

1. **Self-hosting platform engineer** — an SRE or platform engineer standing up Cardinal Data Lake in their own cloud. They are in a terminal with a half-finished helm values file, an S3 bucket, and an OpenTelemetry collector. They need commands that work, values that are correct for their deployment model, and sizing they can defend.
2. **Existing Cardinal UI customer** — already onboarded, now configuring the platform: integrations (GitHub, Jira, PagerDuty, Slack, Snowflake, BigQuery, ClickHouse, Postgres, Athena, Kubernetes, ServiceNow, Confluence, Teams), MCP clients, OIDC, Bedrock/Vertex model access, and agent-outcomes plugins for Claude Code / Codex / Cursor.

Both are fluent in telemetry and skeptical of prose that does not resolve to a command, a field, or a diagram. The docs site is not a funnel; the reader has already chosen Cardinal.

## Product Purpose

`docs.cardinalhq.io` is the operating manual for Cardinal's two products. It exists so a reader can install, configure, and operate Cardinal without contacting support.

**Success is an unblocked install, unaided** — the reader completes a real install or configuration end to end, in one sitting, without opening a support ticket. Fast reference lookup (a flag, a query-language clause, an integration field) is the recurring secondary job, but task completion is what the site is optimized for.

## Positioning

The docs are the honest counterpart to the marketing site. Where `cardinalhq.io` argues, `docs.cardinalhq.io` shows the exact YAML. Cardinal is self-hostable in the customer's own cloud, which means the documentation must be complete enough to operate the system without Cardinal's staff in the room — a claim most observability vendors' docs cannot make, because their product runs on the vendor's infrastructure.

## Operating Context

- Read on a laptop, usually beside a terminal and a cloud console; copy-paste out of the page is the dominant interaction.
- Content is organized by product, matching the reader's mental model:
  - `content/ui/` → `/ui/*` — Cardinal UI (formerly Maestro): install, integrations, MCP clients, agent outcomes, updates.
  - `content/data-lake/` → `/data-lake/*` — Cardinal Data Lake (formerly Lakerunner): quickstart, install, manual install, collectors, CLI, architecture, instrumentation (Go/Java/Node/Python/React), query language, sizing, Loki comparison, OTel demo.
  - `content/how-to/` → `/how-to/*` — cross-cutting recipes (OpenShift pod logs, Prometheus federation, Postgres exporter sidecar, Proxmox/Ceph OTel).
- Several pages are interactive tools, not prose: `LakerunnerHelmValuesWizard`, `CollectorManifestsWizard`, `SizingEstimator`, `QuerySizingEstimator`, `QuickStartSteps`. These are the load-bearing parts of the install path and must keep working.
- `SupportCallout` is the standard escape hatch when the docs run out; it appears across pages.

## Capabilities and Constraints

- **Stack:** Next.js 16 App Router + Nextra 4 (`nextra-theme-docs`), MDX content, TypeScript, pnpm. Navigation and page titles come from per-directory `_meta.ts`.
- **Static-only, GitHub Pages.** `output: 'export'` builds to `out/`, deployed by `.github/workflows/nextjs.yml` to GitHub Pages at `docs.cardinalhq.io` (CNAME). **There is no server runtime** — no API routes, no middleware, no server-side redirects, no image optimization (`images.unoptimized`). Anything dynamic must be client-side.
- **Search** is Pagefind, indexed at postbuild against the static `out/` directory.
- **Legacy URLs must keep resolving.** `/maestro/*` → `/ui/*` and `/lakerunner/*` → `/data-lake/*`, implemented as an inline pre-hydration script in `app/not-found.tsx` because Pages offers no server redirect. Inbound links from before the rename must not break.
- **Underlying product names are unchanged and binding.** The docs brand is Cardinal, but the CLI (`lakerunner`), helm charts, container image references, Kubernetes namespaces, and IAM identifiers keep their original names — they ship from separate repos. Never "fix" these to match the brand.
- Fonts are Figtree (sans) and JetBrains Mono (mono), self-hosted via `next/font/google`, exposed as `--font-sans` / `--font-mono`.
- Analytics is GA4 on the **same stream as `cardinalhq.io`** (`G-051X4VR1RL`), deliberately, so a visitor crossing between the sites stays one user/session.
- `pnpm test` runs Jest, including a link checker (`lib/__tests__/links.test.ts`).

## Brand Commitments

- **Cardinal umbrella brand**, two products: **Cardinal UI** and **Cardinal Data Lake**. Former names (Maestro, Lakerunner) appear only where they still ship as identifiers.
- The **chip mascot** (`/chip.png`) is the brand mark, used as navbar logo and favicon.
- Voice inherited from the marketing site and product: calm, precise, trustworthy — a senior engineer explaining something real. Engineering candor over vendor enthusiasm.
- The visual identity is the dark control-room system shared with `cardinalhq.io`; the incumbent record is this repo's `DESIGN.md`, copied from the website repo. **Open decision:** that document describes a dark-only marketing site, while this site runs the Nextra docs theme with a light/dark toggle. The reconciliation is a visual-world decision and has not been made.
- Copyright: © 2025-2026 Cardinal HQ, Inc.

## Evidence on Hand

- Real product screenshots in `public/`, shown via `ExpandableImage` click-to-zoom.
- Hand-built diagrams in `components/diagrams/`.
- Working install artifacts: helm values, collector manifests, CLI invocations, instrumentation snippets per language — all generated or transcribed from the shipping products.
- Comparative content: `data-lake/loki-comparison.mdx`.
- **Absent, and not to be invented here:** pricing, benchmarks, customer names, testimonials, uptime or performance claims. Those live on the marketing site where they can be sourced. Docs state only what ships.

## Product Principles

1. **The reader is mid-install.** Every page assumes an interrupted task. Get them to a working command fast; explain after, or in a linked page.
2. **Copy-paste must be correct.** A command, manifest, or values block that does not run as printed is a defect, not a typo. Interactive generators exist because hand-transcribed YAML drifts.
3. **Only what ships.** No aspirational features, no invented numbers, no marketing claims. If it is not in the product, it is not in the docs.
4. **Brand on the surface, original names underneath.** Cardinal is what the reader sees; `lakerunner` is what they type. Never collapse the two.
5. **Nothing may break an inbound link.** URLs are the docs' public API — renames carry redirects forever.

## Accessibility & Inclusion

Inherits the marketing site's WCAG 2.1 AA commitment: body contrast ≥4.5:1, large text ≥3:1, full keyboard navigation, a visible focus ring on every interactive element, and a `prefers-reduced-motion` path for any animation. Docs-specific weight: the interactive wizards and estimators are form UI and must be keyboard-operable and screen-reader-labeled, not just visually correct.
