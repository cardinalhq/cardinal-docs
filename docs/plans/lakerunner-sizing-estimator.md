# Lakerunner Sizing Estimator — Implementation Plan

## Overview

Build an interactive sizing estimator page for the Lakerunner docs site. The page will have a React component that accepts user throughput inputs, calculates pod counts and resource requirements, and renders a summary table + SVG pie chart.

## File Changes

### Create
1. `components/SizingEstimator.tsx` — Main React component
2. `components/SizingEstimator.module.css` — CSS module (follows existing pattern)
3. `lib/sizingCalculations.ts` — Pure calculation functions (normalization, pod counts, resource totals)
4. `pages/lakerunner/sizing.mdx` — MDX page that imports the component

### Modify
1. `pages/lakerunner/_meta.json` — Add "sizing" nav entry

## Implementation Steps

### Step 1: Create calculation utilities (`lib/sizingCalculations.ts`)
- Time unit conversion: normalize any input to per-second
- Pod count formulas for each component type
- Resource aggregation by category (core, logs, metrics, traces, query)
- Type definitions for inputs and outputs

### Step 2: Create the SizingEstimator component (`components/SizingEstimator.tsx`)
- **Input section**: Time unit selector (dropdown), throughput fields for logs/metrics/traces, query worker count stepper
- **Results section**: Summary table with component breakdown, grand totals
- **Pie chart**: Simple SVG donut/pie chart showing vCPU distribution across 5 categories
- **Recommendations callout**: Auto-scaling note, cluster auto-scaling, spot/preemptible instance guidance
- All state managed with useState hooks
- Follow existing component patterns (CSS modules, dark mode support)

### Step 3: Create CSS module (`components/SizingEstimator.module.css`)
- Reuse visual patterns from `LakerunnerHelmValuesWizard.module.css`
- Section cards, form controls, tables, pie chart container
- Dark mode via `:global(.dark)` selectors
- Responsive grid for mobile

### Step 4: Create the MDX page (`pages/lakerunner/sizing.mdx`)
- Import SizingEstimator component
- Brief introductory text
- Render the component
- Import SupportCallout at bottom

### Step 5: Update navigation (`pages/lakerunner/_meta.json`)
- Add `"sizing": "Sizing Estimator"` entry

## Testing Strategy
- Manual verification in dev server (all time units, zero inputs, large inputs)
- Visual verification of pie chart rendering
- Dark mode toggle check
- `pnpm build` success

## Risks / Considerations
- SVG pie chart needs to handle edge case where all categories are 0 (show empty state)
- Pie chart needs to handle single-category case (full circle, not a zero-width arc)
- Memory values mix Mi and Gi — normalize everything to Mi internally, display as Gi
- No external charting dependency — pure SVG with calculated arc paths
