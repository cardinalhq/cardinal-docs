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
const LOG_INGEST_CAPACITY = 40_000;
const TRACE_INGEST_CAPACITY = 40_000;
const METRIC_INGEST_CAPACITY = 20_000;

// Resource sizing per pod (from Helm values.yaml defaults)
export interface PodResources {
  cpu: number;    // vCPU
  memoryMi: number; // MiB
}

export const RESOURCE_DEFAULTS: Record<string, PodResources> = {
  // Core components
  sweeper:    { cpu: 0.25, memoryMi: 300 },
  monitoring: { cpu: 0.25, memoryMi: 100 },
  adminApi:   { cpu: 0.25, memoryMi: 200 },
  boxer:      { cpu: 0.2,  memoryMi: 250 },
  // Log pipeline
  ingestLogs:  { cpu: 1, memoryMi: 4096 },
  compactLogs: { cpu: 1, memoryMi: 4096 },
  // Metric pipeline
  ingestMetrics:  { cpu: 1, memoryMi: 4096 },
  compactMetrics: { cpu: 1, memoryMi: 5120 },
  rollupMetrics:  { cpu: 4, memoryMi: 8192 },
  // Trace pipeline
  ingestTraces:  { cpu: 1, memoryMi: 4096 },
  compactTraces: { cpu: 1, memoryMi: 4096 },
  // Query
  queryApi:    { cpu: 1, memoryMi: 4096 },
  queryWorker: { cpu: 2, memoryMi: 4096 },
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

  // Pod counts
  // Logs and metrics always have a minimum of 1 ingest pod (needed to monitor Lakerunner itself)
  const logIngestPods = Math.max(1, Math.ceil(logsPerSec / LOG_INGEST_CAPACITY));
  const logCompactPods = Math.max(1, Math.ceil(logIngestPods * 0.5));

  const metricIngestPods = Math.max(1, Math.ceil(metricsPerSec / METRIC_INGEST_CAPACITY));
  const metricCompactPods = Math.max(1, Math.ceil(metricIngestPods * 1.5));
  const metricRollupPods = metricIngestPods; // 1:1 match

  // Traces can scale to 0
  const traceIngestPods = tracesPerSec > 0 ? Math.ceil(tracesPerSec / TRACE_INGEST_CAPACITY) : 0;
  const traceCompactPods = traceIngestPods > 0 ? Math.max(1, Math.ceil(traceIngestPods * 0.5)) : 0;

  const r = RESOURCE_DEFAULTS;

  const components: ComponentEstimate[] = [
    // Core (always present)
    { name: 'Sweeper', category: 'core', pods: 1, cpuPerPod: r.sweeper.cpu, memoryMiPerPod: r.sweeper.memoryMi, totalCpu: r.sweeper.cpu, totalMemoryMi: r.sweeper.memoryMi },
    { name: 'Monitoring', category: 'core', pods: 1, cpuPerPod: r.monitoring.cpu, memoryMiPerPod: r.monitoring.memoryMi, totalCpu: r.monitoring.cpu, totalMemoryMi: r.monitoring.memoryMi },
    { name: 'Admin API', category: 'core', pods: 1, cpuPerPod: r.adminApi.cpu, memoryMiPerPod: r.adminApi.memoryMi, totalCpu: r.adminApi.cpu, totalMemoryMi: r.adminApi.memoryMi },
    { name: 'Boxer', category: 'core', pods: 1, cpuPerPod: r.boxer.cpu, memoryMiPerPod: r.boxer.memoryMi, totalCpu: r.boxer.cpu, totalMemoryMi: r.boxer.memoryMi },
    // Logs
    ...(logIngestPods > 0 ? [
      { name: 'Log Ingest', category: 'logs' as const, pods: logIngestPods, cpuPerPod: r.ingestLogs.cpu, memoryMiPerPod: r.ingestLogs.memoryMi, totalCpu: logIngestPods * r.ingestLogs.cpu, totalMemoryMi: logIngestPods * r.ingestLogs.memoryMi },
      { name: 'Log Compact', category: 'logs' as const, pods: logCompactPods, cpuPerPod: r.compactLogs.cpu, memoryMiPerPod: r.compactLogs.memoryMi, totalCpu: logCompactPods * r.compactLogs.cpu, totalMemoryMi: logCompactPods * r.compactLogs.memoryMi },
    ] : []),
    // Metrics
    ...(metricIngestPods > 0 ? [
      { name: 'Metric Ingest', category: 'metrics' as const, pods: metricIngestPods, cpuPerPod: r.ingestMetrics.cpu, memoryMiPerPod: r.ingestMetrics.memoryMi, totalCpu: metricIngestPods * r.ingestMetrics.cpu, totalMemoryMi: metricIngestPods * r.ingestMetrics.memoryMi },
      { name: 'Metric Compact', category: 'metrics' as const, pods: metricCompactPods, cpuPerPod: r.compactMetrics.cpu, memoryMiPerPod: r.compactMetrics.memoryMi, totalCpu: metricCompactPods * r.compactMetrics.cpu, totalMemoryMi: metricCompactPods * r.compactMetrics.memoryMi },
      { name: 'Metric Rollup', category: 'metrics' as const, pods: metricRollupPods, cpuPerPod: r.rollupMetrics.cpu, memoryMiPerPod: r.rollupMetrics.memoryMi, totalCpu: metricRollupPods * r.rollupMetrics.cpu, totalMemoryMi: metricRollupPods * r.rollupMetrics.memoryMi },
    ] : []),
    // Traces
    ...(traceIngestPods > 0 ? [
      { name: 'Trace Ingest', category: 'traces' as const, pods: traceIngestPods, cpuPerPod: r.ingestTraces.cpu, memoryMiPerPod: r.ingestTraces.memoryMi, totalCpu: traceIngestPods * r.ingestTraces.cpu, totalMemoryMi: traceIngestPods * r.ingestTraces.memoryMi },
      { name: 'Trace Compact', category: 'traces' as const, pods: traceCompactPods, cpuPerPod: r.compactTraces.cpu, memoryMiPerPod: r.compactTraces.memoryMi, totalCpu: traceCompactPods * r.compactTraces.cpu, totalMemoryMi: traceCompactPods * r.compactTraces.memoryMi },
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
