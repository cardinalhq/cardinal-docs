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
