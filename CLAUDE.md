# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Cardinal product documentation site built with [Nextra](https://nextra.site/) (Next.js-based documentation framework) and TypeScript. The site documents Cardinal's two products, both under the Cardinal umbrella brand:
- **Cardinal UI** (formerly Maestro) - AI-powered observability and incident-management platform. Docs at `content/ui/`, served at `/ui/*`.
- **Cardinal Data Lake** (formerly Lakerunner) - S3-based observability stack. Docs at `content/data-lake/`, served at `/data-lake/*`.

Legacy `/maestro/*` and `/lakerunner/*` URLs redirect via `app/not-found.tsx`. The underlying CLI (`lakerunner`), helm charts, container image refs, k8s namespaces, and IAM identifiers are unchanged — they keep the original names because they ship in separate repos.

## Development Commands

```bash
# Install dependencies (requires pnpm)
pnpm i

# Start development server (http://localhost:3000)
pnpm dev

# Build for production
pnpm build
```

## Git

- Do not use --amend to modify history as we will squash at merge time.

## Architecture

### Documentation Structure
- `content/` - MDX content files organized by product
  - `content/_meta.ts` - Navigation structure and page titles
  - `content/ui/` - Cardinal UI docs (installation, integrations, MCP clients, agent outcomes)
  - `content/data-lake/` - Cardinal Data Lake docs (install, collectors, CLI, architecture)
  - `content/how-to/` - Cross-cutting recipes
- `app/` - Next.js App Router (layout, catch-all route for MDX)
- `components/` - React components used in MDX pages
- `next.config.mjs` - Next.js configuration with Nextra plugin
- `mdx-components.tsx` - MDX component overrides

### Nextra Conventions
- Each directory can have a `_meta.ts` to define navigation order and titles
- Pages are written in MDX (Markdown with JSX support)
- React components from `components/` can be imported directly in MDX files
- Images go in `public/` and are referenced with absolute paths (e.g., `/chip.png`)

### Key Components
- `SupportCallout.tsx` - Standard support/contact callout used across pages
- `ExpandableImage.tsx` - Clickable expandable images for screenshots
- `ConnectorGrid.tsx`, `ConnectorCard.tsx` - Grid display for connector documentation
- `QuickStartSteps.tsx` - Cardinal Data Lake quickstart walkthrough (used on `content/data-lake/manual-install.mdx`)
- `LakerunnerHelmValuesWizard.tsx` - Interactive Helm-values builder for the Data Lake install page
