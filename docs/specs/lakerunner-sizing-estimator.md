# Lakerunner Sizing Estimator — Specification

## Goal

Build an interactive sizing estimation page for Lakerunner that helps users estimate the vCPU and memory footprint of their deployment based on expected telemetry throughput. The calculator runs entirely in the browser (no server calls) and produces a visual breakdown of resource requirements across five component categories.

## Requirements

### Functional

1. **Input: Telemetry Throughput**
   - User selects a time unit: per second, per minute, per hour, per day, or per month
   - User enters volume for each enabled signal type:
     - Logs: lines per [time unit]
     - Metrics: datapoints per [time unit]
     - Traces: spans per [time unit]
   - All values are normalized to per-second internally for pod calculation
   - Conversion factors: second=1, minute=60, hour=3600, day=86400, month=2592000 (30-day month)
   - Accept non-negative numeric values only; empty/invalid input treated as 0

2. **Input: Query Workers**
   - Minimum 2 query-api pods (fixed, not user-configurable below 2)
   - Minimum 2 query-worker pods (user can increase, minimum 2)
   - UI allows user to choose additional query workers beyond the minimum

3. **Pod Calculation Logic** (per-second throughput basis)
   - **Log ingest pods**: ceil(logs_per_sec / 40,000)
   - **Trace ingest pods**: ceil(traces_per_sec / 40,000)
   - **Metric ingest pods**: ceil(metrics_per_sec / 20,000)
   - **Log compact pods**: ceil(log_ingest_pods * 0.5)
   - **Trace compact pods**: ceil(trace_ingest_pods * 0.5)
   - **Metric compact pods**: ceil(metric_ingest_pods * 1.5)
   - **Metric rollup pods**: metric_ingest_pods (1:1 match)
   - **Query API pods**: 2 (fixed minimum)
   - **Query Worker pods**: 2 minimum, user-selectable higher
   - If throughput for a signal is 0, related ingest/compact/rollup pods are 0

4. **Resource Sizing per Pod** (from Helm values.yaml defaults)
   - Core components (always present):
     - setup: 1.1 vCPU, 250Mi memory (run-once job, excluded from steady-state)
     - sweeper: 0.25 vCPU, 300Mi memory
     - monitoring: 0.25 vCPU, 100Mi memory
     - admin-api: 0.25 vCPU, 200Mi memory
     - boxer (common): 0.2 vCPU, 250Mi memory
   - Log pipeline per pod: 1 vCPU, 4Gi memory (ingest and compact)
   - Metric ingest per pod: 1 vCPU, 4Gi memory
   - Metric compact per pod: 1 vCPU, 5Gi memory
   - Metric rollup per pod: 4 vCPU, 8Gi memory
   - Trace pipeline per pod: 1 vCPU, 4Gi memory (ingest and compact)
   - Query API per pod: 1 vCPU, 4Gi memory
   - Query Worker per pod: 2 vCPU, 4Gi memory

5. **Output: Resource Summary**
   - Table showing each component, pod count, per-pod resources, and total resources
   - Grand total vCPU and memory
   - Simple pie chart showing resource distribution across 5 categories:
     - Core Components (sweeper + monitoring + admin-api + boxer)
     - Logs (ingest + compact)
     - Metrics (ingest + compact + rollup)
     - Traces (ingest + compact)
     - Query (query-api + query-workers)

6. **Recommendations Callout**
   - Note that log, metric, trace, and query components auto-scale based on demand — this estimate represents a maximum
   - Recommend cluster auto-scaling to remove unneeded k8s nodes as load changes
   - Recommend Spot instances (AWS) / Preemptible VMs (GCP) for this workload to reduce cost

### Non-Functional
- Runs entirely client-side in the browser — no data sent to any server
- Follows existing Nextra + CSS module patterns used in the codebase
- Supports dark mode (matches existing `:global(.dark)` pattern)
- Responsive layout for mobile

## Scope

### In Scope
- New MDX page at `pages/lakerunner/sizing.mdx`
- New React component `components/SizingEstimator.tsx` with CSS module
- SVG-based pie chart (no external charting library dependency)
- Navigation entry in `pages/lakerunner/_meta.json`

### Out of Scope
- Cost estimation (no dollar amounts)
- Persistent storage / saving configurations
- PubSub pod sizing (notification delivery is deployment-specific)
- Grafana pod sizing (optional component)
- Collector pod sizing (managed separately)

## Acceptance Criteria
- [ ] Page accessible at `/lakerunner/sizing` in the nav
- [ ] User can select time unit and enter throughput for logs, metrics, traces
- [ ] Pod counts and resource totals calculate correctly per the formulas above
- [ ] Pie chart renders showing the 5 category breakdown (by vCPU)
- [ ] Recommendations section displays auto-scaling, cluster auto-scaling, and spot instance guidance
- [ ] Dark mode works correctly
- [ ] Responsive on mobile
- [ ] `pnpm build` succeeds without errors

## Open Questions
- None at this time — all requirements provided by user
