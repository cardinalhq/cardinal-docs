export type TimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'month';

export const TIME_UNIT_LABELS: Record<TimeUnit, string> = {
  second: 'per second',
  minute: 'per minute',
  hour: 'per hour',
  day: 'per day',
  month: 'per month',
};

const TIME_UNIT_DIVISORS: Record<TimeUnit, number> = {
  second: 1,
  minute: 60,
  hour: 3_600,
  day: 86_400,
  month: 2_592_000, // 30-day month
};

// Throughput capacity per pod (events per second)
const LOG_INGEST_CAPACITY = 20_000;
const TRACE_INGEST_CAPACITY = 25_000;
const METRIC_INGEST_CAPACITY = 15_000;

// Resource sizing per pod (from Helm values.yaml defaults)
export interface PodResources {
  cpu: number;    // vCPU
  memoryMi: number; // MiB
}

export const RESOURCE_DEFAULTS: Record<string, PodResources> = {
  // Common services — single combined pod (admin-api, alert-evaluator, monitoring, sweeper),
  // summed container requests rounded up to a full core and the nearest 256 MiB.
  commonServices: { cpu: 1, memoryMi: 256 },
  // Pub/sub ingestion trigger (SQS)
  pubsub: { cpu: 1, memoryMi: 512 },
  // Per-signal processing pod (ingest + compact + rollup merged)
  logProcessing:    { cpu: 1, memoryMi: 2048 },
  metricProcessing: { cpu: 1, memoryMi: 2048 },
  traceProcessing:  { cpu: 1, memoryMi: 2048 },
  // Query
  queryApi:    { cpu: 2, memoryMi: 2048 },
  queryWorker: { cpu: 4, memoryMi: 4096 },
};

export interface SizingInput {
  logsPerUnit: number;
  metricsPerUnit: number;
  tracesPerUnit: number;
  timeUnit: TimeUnit;
  queryWorkers: number;
}

export interface ComponentEstimate {
  name: string;
  category: 'core' | 'logs' | 'metrics' | 'traces' | 'query';
  pods: number;
  cpuPerPod: number;
  memoryMiPerPod: number;
  totalCpu: number;
  totalMemoryMi: number;
}

export interface SizingResult {
  components: ComponentEstimate[];
  categoryTotals: Record<string, { cpu: number; memoryMi: number }>;
  grandTotalCpu: number;
  grandTotalMemoryMi: number;
}

export function normalizeToPerSecond(value: number, unit: TimeUnit): number {
  const divisor = TIME_UNIT_DIVISORS[unit];
  return value / divisor;
}

export function calculateSizing(input: SizingInput): SizingResult {
  const logsPerSec = normalizeToPerSecond(Math.max(0, input.logsPerUnit), input.timeUnit);
  const metricsPerSec = normalizeToPerSecond(Math.max(0, input.metricsPerUnit), input.timeUnit);
  const tracesPerSec = normalizeToPerSecond(Math.max(0, input.tracesPerUnit), input.timeUnit);
  const queryWorkers = Math.max(2, Math.round(input.queryWorkers));

  // Pod counts — one processing pod per signal, sized by ingest throughput.
  // Logs and metrics always have a minimum of 1 pod (needed to monitor Lakerunner itself).
  const logProcessingPods = Math.max(1, Math.ceil(logsPerSec / LOG_INGEST_CAPACITY));
  const metricProcessingPods = Math.max(1, Math.ceil(metricsPerSec / METRIC_INGEST_CAPACITY));
  // Traces can scale to 0
  const traceProcessingPods = tracesPerSec > 0 ? Math.ceil(tracesPerSec / TRACE_INGEST_CAPACITY) : 0;

  const r = RESOURCE_DEFAULTS;

  const components: ComponentEstimate[] = [
    // Core (always present)
    { name: 'Common Services', category: 'core', pods: 1, cpuPerPod: r.commonServices.cpu, memoryMiPerPod: r.commonServices.memoryMi, totalCpu: r.commonServices.cpu, totalMemoryMi: r.commonServices.memoryMi },
    { name: 'Pub/Sub (SQS)', category: 'core', pods: 2, cpuPerPod: r.pubsub.cpu, memoryMiPerPod: r.pubsub.memoryMi, totalCpu: 2 * r.pubsub.cpu, totalMemoryMi: 2 * r.pubsub.memoryMi },
    // Logs
    ...(logProcessingPods > 0 ? [
      { name: 'Log Processing', category: 'logs' as const, pods: logProcessingPods, cpuPerPod: r.logProcessing.cpu, memoryMiPerPod: r.logProcessing.memoryMi, totalCpu: logProcessingPods * r.logProcessing.cpu, totalMemoryMi: logProcessingPods * r.logProcessing.memoryMi },
    ] : []),
    // Metrics
    ...(metricProcessingPods > 0 ? [
      { name: 'Metric Processing', category: 'metrics' as const, pods: metricProcessingPods, cpuPerPod: r.metricProcessing.cpu, memoryMiPerPod: r.metricProcessing.memoryMi, totalCpu: metricProcessingPods * r.metricProcessing.cpu, totalMemoryMi: metricProcessingPods * r.metricProcessing.memoryMi },
    ] : []),
    // Traces
    ...(traceProcessingPods > 0 ? [
      { name: 'Trace Processing', category: 'traces' as const, pods: traceProcessingPods, cpuPerPod: r.traceProcessing.cpu, memoryMiPerPod: r.traceProcessing.memoryMi, totalCpu: traceProcessingPods * r.traceProcessing.cpu, totalMemoryMi: traceProcessingPods * r.traceProcessing.memoryMi },
    ] : []),
    // Query (always present)
    { name: 'Query API', category: 'query', pods: 2, cpuPerPod: r.queryApi.cpu, memoryMiPerPod: r.queryApi.memoryMi, totalCpu: 2 * r.queryApi.cpu, totalMemoryMi: 2 * r.queryApi.memoryMi },
    { name: 'Query Worker', category: 'query', pods: queryWorkers, cpuPerPod: r.queryWorker.cpu, memoryMiPerPod: r.queryWorker.memoryMi, totalCpu: queryWorkers * r.queryWorker.cpu, totalMemoryMi: queryWorkers * r.queryWorker.memoryMi },
  ];

  // Category totals
  const categories = ['core', 'logs', 'metrics', 'traces', 'query'] as const;
  const categoryTotals: Record<string, { cpu: number; memoryMi: number }> = {};
  for (const cat of categories) {
    const catComponents = components.filter(c => c.category === cat);
    categoryTotals[cat] = {
      cpu: catComponents.reduce((sum, c) => sum + c.totalCpu, 0),
      memoryMi: catComponents.reduce((sum, c) => sum + c.totalMemoryMi, 0),
    };
  }

  const grandTotalCpu = components.reduce((sum, c) => sum + c.totalCpu, 0);
  const grandTotalMemoryMi = components.reduce((sum, c) => sum + c.totalMemoryMi, 0);

  return { components, categoryTotals, grandTotalCpu, grandTotalMemoryMi };
}

export function formatMemoryGi(mi: number): string {
  return (mi / 1024).toFixed(2);
}

export function formatCpu(cpu: number): string {
  return cpu.toFixed(2);
}

// ---------------------------------------------------------------------------
// Approximate compute pricing — Graviton (ARM) instances with local NVMe
// (e.g. c6gd). Priced per vCPU-hour. On-demand is effectively identical across
// us-east-1/us-east-2/us-west-2, so we don't break it out by region. Spot is
// shown as a range (~60-70% off on-demand) since it fluctuates constantly.
// ---------------------------------------------------------------------------
export const ONDEMAND_VCPU_HOURLY_USD = 0.0384; // c6gd (Graviton2, 2 GiB/vCPU, local NVMe)
export const SPOT_DISCOUNT = { min: 0.60, max: 0.70 }; // fraction off on-demand
export const HOURS_PER_MONTH = 730;

export function monthlyOnDemandCost(totalVcpu: number): number {
  return totalVcpu * ONDEMAND_VCPU_HOURLY_USD * HOURS_PER_MONTH;
}

// Returns [low, high]: low = deepest discount (max % off), high = shallowest.
export function monthlySpotCostRange(totalVcpu: number): { low: number; high: number } {
  const od = monthlyOnDemandCost(totalVcpu);
  return { low: od * (1 - SPOT_DISCOUNT.max), high: od * (1 - SPOT_DISCOUNT.min) };
}

// ---------------------------------------------------------------------------
// Query sizing — derives QPS, pod groups, and monthly cost from usage signals.
// ---------------------------------------------------------------------------

// 4 pods @ 2 vCPU + 4 GiB each handle up to 30 QPS, so a "group" of 4 pods
// is the unit we scale in. Each pod is 7.5 QPS; we round up to 4-pod groups
// with a minimum of one group for HA.
export const QUERY_POD_GROUP_SIZE = 4;
export const QUERY_GROUP_QPS_CAPACITY = 30;
export const QUERY_POD_CPU = 2;
export const QUERY_POD_MEMORY_MI = 4096;

export interface QuerySizingInput {
  dashboards: number;
  alerts: number;
  engineers: number;

  // Tunable assumptions (exposed in the UI as "Advanced").
  alertEvalIntervalSec: number;          // how often each alert evaluates
  panelsPerDashboard: number;            // avg query-emitting panels per dashboard
  panelRefreshSec: number;               // dashboard panel auto-refresh interval
  dashboardConcurrency: number;          // dashboards actively viewed per engineer at peak
  adhocQueriesPerEngineerPerHour: number;
  peakHoursPerDay: number;
  peakDaysPerWeek: number;
  costPerPodHourUsd: number;
  headroomFactor: number;                // multiplier applied to QPS before sizing (slow queries, retries, latency variance)
  minPodGroups: number;                  // minimum pod groups for HA, even at low QPS
}

export interface QuerySizingResult {
  alertQps: number;
  dashboardQps: number;
  adhocQps: number;
  peakQps: number;
  offPeakQps: number;
  peakPods: number;
  offPeakPods: number;
  peakHoursPerMonth: number;
  offPeakHoursPerMonth: number;
  monthlyCostUsd: number;
  peakMonthlyCostUsd: number;
  offPeakMonthlyCostUsd: number;
  peakCpu: number;
  peakMemoryMi: number;
  offPeakCpu: number;
  offPeakMemoryMi: number;
}

export const QUERY_SIZING_DEFAULTS: Omit<QuerySizingInput, 'dashboards' | 'alerts' | 'engineers'> = {
  alertEvalIntervalSec: 60,
  panelsPerDashboard: 12,
  panelRefreshSec: 20,
  dashboardConcurrency: 1.0,
  adhocQueriesPerEngineerPerHour: 5,
  peakHoursPerDay: 10,
  peakDaysPerWeek: 5,
  costPerPodHourUsd: 0.06,
  headroomFactor: 3.0,
  minPodGroups: 2,
};

const WEEKS_PER_MONTH = 4.345;
const HOURS_PER_WEEK = 168;

function podsForQps(qps: number, headroomFactor: number, minPodGroups: number): number {
  const effectiveQps = Math.max(0, qps) * Math.max(0, headroomFactor);
  const minGroups = Math.max(1, Math.floor(minPodGroups));
  const groups = Math.max(minGroups, Math.ceil(effectiveQps / QUERY_GROUP_QPS_CAPACITY));
  return groups * QUERY_POD_GROUP_SIZE;
}

export function calculateQuerySizing(input: QuerySizingInput): QuerySizingResult {
  const dashboards = Math.max(0, input.dashboards);
  const alerts = Math.max(0, input.alerts);
  const engineers = Math.max(0, input.engineers);
  const alertEvalIntervalSec = Math.max(1, input.alertEvalIntervalSec);
  const panelsPerDashboard = Math.max(0, input.panelsPerDashboard);
  const panelRefreshSec = Math.max(1, input.panelRefreshSec);
  const dashboardConcurrency = Math.max(0, input.dashboardConcurrency);
  const adhocPerHour = Math.max(0, input.adhocQueriesPerEngineerPerHour);
  const peakHoursPerDay = Math.min(24, Math.max(0, input.peakHoursPerDay));
  const peakDaysPerWeek = Math.min(7, Math.max(0, input.peakDaysPerWeek));
  const costPerPodHourUsd = Math.max(0, input.costPerPodHourUsd);
  const headroomFactor = Math.max(1, input.headroomFactor);
  const minPodGroups = Math.max(1, Math.floor(input.minPodGroups));

  const alertQps = alerts / alertEvalIntervalSec;

  const concurrentDashboards = Math.min(dashboards, engineers * dashboardConcurrency);
  const dashboardQps = (concurrentDashboards * panelsPerDashboard) / panelRefreshSec;

  const adhocQps = (engineers * adhocPerHour) / 3600;

  const peakQps = alertQps + dashboardQps + adhocQps;
  const offPeakQps = alertQps;

  const peakPods = podsForQps(peakQps, headroomFactor, minPodGroups);
  const offPeakPods = podsForQps(offPeakQps, headroomFactor, minPodGroups);

  const peakHoursPerWeek = Math.min(HOURS_PER_WEEK, peakHoursPerDay * peakDaysPerWeek);
  const offPeakHoursPerWeek = HOURS_PER_WEEK - peakHoursPerWeek;
  const peakHoursPerMonth = peakHoursPerWeek * WEEKS_PER_MONTH;
  const offPeakHoursPerMonth = offPeakHoursPerWeek * WEEKS_PER_MONTH;

  const peakMonthlyCostUsd = peakPods * peakHoursPerMonth * costPerPodHourUsd;
  const offPeakMonthlyCostUsd = offPeakPods * offPeakHoursPerMonth * costPerPodHourUsd;

  return {
    alertQps,
    dashboardQps,
    adhocQps,
    peakQps,
    offPeakQps,
    peakPods,
    offPeakPods,
    peakHoursPerMonth,
    offPeakHoursPerMonth,
    monthlyCostUsd: peakMonthlyCostUsd + offPeakMonthlyCostUsd,
    peakMonthlyCostUsd,
    offPeakMonthlyCostUsd,
    peakCpu: peakPods * QUERY_POD_CPU,
    peakMemoryMi: peakPods * QUERY_POD_MEMORY_MI,
    offPeakCpu: offPeakPods * QUERY_POD_CPU,
    offPeakMemoryMi: offPeakPods * QUERY_POD_MEMORY_MI,
  };
}
