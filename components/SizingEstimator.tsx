'use client';

import { useState, useMemo } from 'react';
import styles from './SizingEstimator.module.css';
import {
  type TimeUnit,
  type SizingInput,
  TIME_UNIT_LABELS,
  calculateSizing,
  formatMemoryGi,
  formatCpu,
} from '../lib/sizingCalculations';

const CATEGORY_COLORS: Record<string, string> = {
  core: '#607D8B',
  logs: '#4CAF50',
  metrics: '#FF9800',
  traces: '#9C27B0',
  query: '#2196F3',
};

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core Components',
  logs: 'Logs',
  metrics: 'Metrics',
  traces: 'Traces',
  query: 'Query',
};

function PieChart({ data }: { data: Record<string, { cpu: number; memoryMi: number }> }) {
  const categories = ['core', 'logs', 'metrics', 'traces', 'query'];
  const values = categories.map(cat => data[cat]?.cpu ?? 0);
  const total = values.reduce((s, v) => s + v, 0);

  if (total === 0) {
    return (
      <div className={styles.pieContainer}>
        <svg viewBox="0 0 200 200" className={styles.pieSvg}>
          <circle cx="100" cy="100" r="80" fill="none" stroke="#ccc" strokeWidth="40" />
          <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" className={styles.pieCenter}>
            0 vCPU
          </text>
        </svg>
        <div className={styles.pieLegend}>
          {categories.map(cat => (
            <div key={cat} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: CATEGORY_COLORS[cat] }} />
              <span className={styles.legendLabel}>{CATEGORY_LABELS[cat]}</span>
              <span className={styles.legendValue}>0 vCPU</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Build arcs
  let cumAngle = -Math.PI / 2; // start at top
  const arcs: { path: string; color: string; cat: string }[] = [];

  for (let i = 0; i < categories.length; i++) {
    const fraction = values[i] / total;
    if (fraction === 0) continue;

    const startAngle = cumAngle;
    const sweep = fraction * 2 * Math.PI;
    cumAngle += sweep;
    const endAngle = cumAngle;

    const cx = 100, cy = 100, r = 80;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = sweep > Math.PI ? 1 : 0;

    const innerR = 50;
    // Near-full-circle: split into two half arcs to avoid SVG rendering issues
    if (fraction > 0.9999) {
      const midAngle = startAngle + Math.PI;
      const mx1 = cx + r * Math.cos(midAngle);
      const my1 = cy + r * Math.sin(midAngle);
      const imx1 = cx + innerR * Math.cos(midAngle);
      const imy1 = cy + innerR * Math.sin(midAngle);
      arcs.push({
        path: `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${mx1} ${my1} L ${imx1} ${imy1} A ${innerR} ${innerR} 0 0 0 ${cx + innerR * Math.cos(startAngle)} ${cy + innerR * Math.sin(startAngle)} Z`,
        color: CATEGORY_COLORS[categories[i]],
        cat: categories[i],
      });
      arcs.push({
        path: `M ${mx1} ${my1} A ${r} ${r} 0 0 1 ${x1} ${y1} L ${cx + innerR * Math.cos(startAngle)} ${cy + innerR * Math.sin(startAngle)} A ${innerR} ${innerR} 0 0 0 ${imx1} ${imy1} Z`,
        color: CATEGORY_COLORS[categories[i]],
        cat: categories[i],
      });
    } else {
      const ix1 = cx + innerR * Math.cos(endAngle);
      const iy1 = cy + innerR * Math.sin(endAngle);
      const ix2 = cx + innerR * Math.cos(startAngle);
      const iy2 = cy + innerR * Math.sin(startAngle);
      arcs.push({
        path: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`,
        color: CATEGORY_COLORS[categories[i]],
        cat: categories[i],
      });
    }
  }

  return (
    <div className={styles.pieContainer}>
      <svg viewBox="0 0 200 200" className={styles.pieSvg}>
        {arcs.map((a, i) => (
          <path key={i} d={a.path} fill={a.color} />
        ))}
        <text x="100" y="95" textAnchor="middle" dominantBaseline="middle" className={styles.pieCenterBig}>
          {formatCpu(total)}
        </text>
        <text x="100" y="112" textAnchor="middle" dominantBaseline="middle" className={styles.pieCenterSmall}>
          total vCPU
        </text>
      </svg>
      <div className={styles.pieLegend}>
        {categories.map(cat => {
          const cpuVal = data[cat]?.cpu ?? 0;
          if (cpuVal === 0) return null;
          const pct = total > 0 ? ((cpuVal / total) * 100).toFixed(0) : '0';
          return (
            <div key={cat} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: CATEGORY_COLORS[cat] }} />
              <span className={styles.legendLabel}>{CATEGORY_LABELS[cat]}</span>
              <span className={styles.legendValue}>{formatCpu(cpuVal)} vCPU ({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SizingEstimator() {
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('second');
  const [logsPerUnit, setLogsPerUnit] = useState<string>('');
  const [metricsPerUnit, setMetricsPerUnit] = useState<string>('');
  const [tracesPerUnit, setTracesPerUnit] = useState<string>('');
  const [queryWorkers, setQueryWorkers] = useState<number>(2);

  const parseNum = (v: string) => {
    const n = parseFloat(v);
    return isNaN(n) || n < 0 ? 0 : n;
  };

  const input: SizingInput = useMemo(() => ({
    logsPerUnit: parseNum(logsPerUnit),
    metricsPerUnit: parseNum(metricsPerUnit),
    tracesPerUnit: parseNum(tracesPerUnit),
    timeUnit,
    queryWorkers,
  }), [logsPerUnit, metricsPerUnit, tracesPerUnit, timeUnit, queryWorkers]);

  const result = useMemo(() => calculateSizing(input), [input]);

  return (
    <div className={styles.estimator}>
      <div className={styles.privacyNote}>
        This calculator runs entirely in your browser. No data is sent to any server.
      </div>

      {/* Input Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Telemetry Throughput</h3>
        <p className={styles.description}>
          Enter your expected telemetry volume. Select a time unit that is convenient for you — all values are normalized internally.
        </p>

        <div className={styles.timeUnitRow}>
          <label className={styles.timeUnitLabel}>Time unit:</label>
          <select
            className={styles.timeUnitSelect}
            value={timeUnit}
            onChange={(e) => setTimeUnit(e.target.value as TimeUnit)}
          >
            {(Object.keys(TIME_UNIT_LABELS) as TimeUnit[]).map(u => (
              <option key={u} value={u}>{TIME_UNIT_LABELS[u]}</option>
            ))}
          </select>
        </div>

        <div className={styles.inputGrid}>
          <div className={styles.inputCard}>
            <label className={styles.inputLabel}>
              <span className={styles.inputDot} style={{ background: CATEGORY_COLORS.logs }} />
              Log Lines
            </label>
            <input
              type="number"
              className={styles.inputField}
              value={logsPerUnit}
              onChange={(e) => setLogsPerUnit(e.target.value)}
              placeholder="0"
              min="0"
            />
            <span className={styles.inputHint}>{TIME_UNIT_LABELS[timeUnit]}</span>
          </div>

          <div className={styles.inputCard}>
            <label className={styles.inputLabel}>
              <span className={styles.inputDot} style={{ background: CATEGORY_COLORS.metrics }} />
              Metric Datapoints
            </label>
            <input
              type="number"
              className={styles.inputField}
              value={metricsPerUnit}
              onChange={(e) => setMetricsPerUnit(e.target.value)}
              placeholder="0"
              min="0"
            />
            <span className={styles.inputHint}>{TIME_UNIT_LABELS[timeUnit]}</span>
          </div>

          <div className={styles.inputCard}>
            <label className={styles.inputLabel}>
              <span className={styles.inputDot} style={{ background: CATEGORY_COLORS.traces }} />
              Trace Spans
            </label>
            <input
              type="number"
              className={styles.inputField}
              value={tracesPerUnit}
              onChange={(e) => setTracesPerUnit(e.target.value)}
              placeholder="0"
              min="0"
            />
            <span className={styles.inputHint}>{TIME_UNIT_LABELS[timeUnit]}</span>
          </div>
        </div>
      </section>

      {/* Query Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Query Capacity</h3>
        <p className={styles.description}>
          Query capacity depends on your query patterns, concurrency, and data volume. We recommend a minimum of 2 query-api and 2 query-worker pods.
        </p>
        <div className={styles.queryRow}>
          <div className={styles.queryItem}>
            <label className={styles.queryLabel}>Query API Pods</label>
            <div className={styles.fixedValue}>2 (minimum)</div>
          </div>
          <div className={styles.queryItem}>
            <label className={styles.queryLabel}>Query Workers</label>
            <div className={styles.stepperRow}>
              <button
                className={styles.stepperBtn}
                onClick={() => setQueryWorkers(Math.max(2, queryWorkers - 1))}
                disabled={queryWorkers <= 2}
              >
                -
              </button>
              <span className={styles.stepperValue}>{queryWorkers}</span>
              <button
                className={styles.stepperBtn}
                onClick={() => setQueryWorkers(queryWorkers + 1)}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Estimated Resources</h3>

        <PieChart data={result.categoryTotals} />

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Pods</th>
                <th>Total vCPU</th>
                <th>Total Memory</th>
              </tr>
            </thead>
            <tbody>
              {(['core', 'logs', 'metrics', 'traces', 'query'] as const).map(cat => {
                const catComponents = result.components.filter(c => c.category === cat);
                const pods = catComponents.reduce((s, c) => s + c.pods, 0);
                const cpu = result.categoryTotals[cat]?.cpu ?? 0;
                const mem = result.categoryTotals[cat]?.memoryMi ?? 0;
                if (pods === 0 && cat !== 'core' && cat !== 'query') return null;
                return (
                  <tr key={cat}>
                    <td>
                      <span className={styles.tableDot} style={{ background: CATEGORY_COLORS[cat] }} />
                      {CATEGORY_LABELS[cat]}
                    </td>
                    <td>{pods}</td>
                    <td>{formatCpu(cpu)} vCPU</td>
                    <td>{formatMemoryGi(mem)} Gi</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className={styles.totalRow}>
                <td><strong>Grand Total</strong></td>
                <td><strong>{result.components.reduce((s, c) => s + c.pods, 0)}</strong></td>
                <td><strong>{formatCpu(result.grandTotalCpu)} vCPU</strong></td>
                <td><strong>{formatMemoryGi(result.grandTotalMemoryMi)} Gi</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Recommendations */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Recommendations</h3>
        <div className={styles.recommendations}>
          <div className={styles.recCard}>
            <h4>Auto-Scaling</h4>
            <p>
              Log, metric, trace, and query components <strong>auto-scale based on demand</strong> using KEDA.
              The estimates above represent a <strong>maximum footprint</strong> at sustained peak load.
              Actual resource usage will be lower during normal operation.
            </p>
          </div>
          <div className={styles.recCard}>
            <h4>Cluster Auto-Scaling</h4>
            <p>
              We strongly recommend enabling <strong>Kubernetes cluster auto-scaling</strong> to automatically
              add and remove nodes as workload pods scale up and down. This ensures you only pay for
              the compute capacity you actually need.
            </p>
          </div>
          <div className={styles.recCard}>
            <h4>Spot / Preemptible Instances</h4>
            <p>
              Lakerunner workloads are well-suited for <strong>Spot Instances</strong> (AWS) or <strong>Preemptible VMs</strong> (GCP).
              These can reduce compute costs by 60-90%. All Lakerunner components are designed to handle
              interruptions gracefully through work queue-based processing.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
