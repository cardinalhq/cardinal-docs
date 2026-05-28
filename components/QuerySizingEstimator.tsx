'use client';

import { useMemo, useState } from 'react';
import styles from './QuerySizingEstimator.module.css';
import {
  type QuerySizingInput,
  QUERY_SIZING_DEFAULTS,
  QUERY_GROUP_QPS_CAPACITY,
  QUERY_POD_GROUP_SIZE,
  QUERY_POD_CPU,
  QUERY_POD_MEMORY_MI,
  calculateQuerySizing,
  formatCpu,
  formatMemoryGi,
} from '../lib/sizingCalculations';

const parseNum = (v: string, fallback = 0): number => {
  const n = parseFloat(v);
  return isNaN(n) || n < 0 ? fallback : n;
};

const formatQps = (qps: number): string => qps.toFixed(qps < 1 ? 2 : 1);

const formatUsd = (n: number): string =>
  n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

export default function QuerySizingEstimator() {
  const [dashboards, setDashboards] = useState<string>('50');
  const [alerts, setAlerts] = useState<string>('100');
  const [engineers, setEngineers] = useState<string>('20');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [alertEvalIntervalSec, setAlertEvalIntervalSec] = useState<string>(String(QUERY_SIZING_DEFAULTS.alertEvalIntervalSec));
  const [panelsPerDashboard, setPanelsPerDashboard] = useState<string>(String(QUERY_SIZING_DEFAULTS.panelsPerDashboard));
  const [panelRefreshSec, setPanelRefreshSec] = useState<string>(String(QUERY_SIZING_DEFAULTS.panelRefreshSec));
  const [dashboardConcurrency, setDashboardConcurrency] = useState<string>(String(QUERY_SIZING_DEFAULTS.dashboardConcurrency));
  const [adhocQueriesPerEngineerPerHour, setAdhoc] = useState<string>(String(QUERY_SIZING_DEFAULTS.adhocQueriesPerEngineerPerHour));
  const [peakHoursPerDay, setPeakHoursPerDay] = useState<string>(String(QUERY_SIZING_DEFAULTS.peakHoursPerDay));
  const [peakDaysPerWeek, setPeakDaysPerWeek] = useState<string>(String(QUERY_SIZING_DEFAULTS.peakDaysPerWeek));
  const [costPerPodHourUsd, setCostPerPodHourUsd] = useState<string>(String(QUERY_SIZING_DEFAULTS.costPerPodHourUsd));
  const [headroomFactor, setHeadroomFactor] = useState<string>(String(QUERY_SIZING_DEFAULTS.headroomFactor));
  const [minPodGroups, setMinPodGroups] = useState<string>(String(QUERY_SIZING_DEFAULTS.minPodGroups));

  const input: QuerySizingInput = useMemo(() => ({
    dashboards: parseNum(dashboards),
    alerts: parseNum(alerts),
    engineers: parseNum(engineers),
    alertEvalIntervalSec: parseNum(alertEvalIntervalSec, QUERY_SIZING_DEFAULTS.alertEvalIntervalSec) || QUERY_SIZING_DEFAULTS.alertEvalIntervalSec,
    panelsPerDashboard: parseNum(panelsPerDashboard, QUERY_SIZING_DEFAULTS.panelsPerDashboard),
    panelRefreshSec: parseNum(panelRefreshSec, QUERY_SIZING_DEFAULTS.panelRefreshSec) || QUERY_SIZING_DEFAULTS.panelRefreshSec,
    dashboardConcurrency: parseNum(dashboardConcurrency, QUERY_SIZING_DEFAULTS.dashboardConcurrency),
    adhocQueriesPerEngineerPerHour: parseNum(adhocQueriesPerEngineerPerHour, QUERY_SIZING_DEFAULTS.adhocQueriesPerEngineerPerHour),
    peakHoursPerDay: parseNum(peakHoursPerDay, QUERY_SIZING_DEFAULTS.peakHoursPerDay),
    peakDaysPerWeek: parseNum(peakDaysPerWeek, QUERY_SIZING_DEFAULTS.peakDaysPerWeek),
    costPerPodHourUsd: parseNum(costPerPodHourUsd, QUERY_SIZING_DEFAULTS.costPerPodHourUsd),
    headroomFactor: parseNum(headroomFactor, QUERY_SIZING_DEFAULTS.headroomFactor) || QUERY_SIZING_DEFAULTS.headroomFactor,
    minPodGroups: parseNum(minPodGroups, QUERY_SIZING_DEFAULTS.minPodGroups) || QUERY_SIZING_DEFAULTS.minPodGroups,
  }), [
    dashboards, alerts, engineers,
    alertEvalIntervalSec, panelsPerDashboard, panelRefreshSec,
    dashboardConcurrency, adhocQueriesPerEngineerPerHour,
    peakHoursPerDay, peakDaysPerWeek, costPerPodHourUsd,
    headroomFactor, minPodGroups,
  ]);

  const r = useMemo(() => calculateQuerySizing(input), [input]);

  return (
    <div className={styles.estimator}>
      <div className={styles.privacyNote}>
        This calculator runs entirely in your browser. No data is sent to any server.
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Your usage</h3>
        <p className={styles.description}>
          Three signals drive query load: how many dashboards are open during peak hours, how many alerts are
          evaluating continuously, and how many engineers are running ad-hoc queries.
        </p>

        <div className={styles.inputGrid}>
          <div className={styles.inputCard}>
            <label className={styles.inputLabel}>Dashboards</label>
            <input
              type="number"
              className={styles.inputField}
              value={dashboards}
              onChange={(e) => setDashboards(e.target.value)}
              min="0"
            />
            <span className={styles.inputHint}>total dashboards defined</span>
          </div>

          <div className={styles.inputCard}>
            <label className={styles.inputLabel}>Alerts</label>
            <input
              type="number"
              className={styles.inputField}
              value={alerts}
              onChange={(e) => setAlerts(e.target.value)}
              min="0"
            />
            <span className={styles.inputHint}>alert rules evaluating 24/7</span>
          </div>

          <div className={styles.inputCard}>
            <label className={styles.inputLabel}>Engineers</label>
            <input
              type="number"
              className={styles.inputField}
              value={engineers}
              onChange={(e) => setEngineers(e.target.value)}
              min="0"
            />
            <span className={styles.inputHint}>people who query during business hours</span>
          </div>
        </div>

        <button
          type="button"
          className={styles.advancedToggle}
          onClick={() => setShowAdvanced(v => !v)}
          aria-expanded={showAdvanced}
        >
          <span className={`${styles.advancedCaret} ${showAdvanced ? styles.advancedCaretOpen : ''}`}>▶</span>
          {showAdvanced ? 'Hide assumptions' : 'Show assumptions'}
        </button>

        {showAdvanced && (
          <div className={styles.advancedPanel}>
            <div className={styles.advancedGrid}>
              <div className={styles.advancedItem}>
                <label>Alert eval interval (sec)</label>
                <input
                  type="number"
                  className={styles.inputField}
                  value={alertEvalIntervalSec}
                  onChange={(e) => setAlertEvalIntervalSec(e.target.value)}
                  min="1"
                />
                <span className={styles.inputHint}>how often each alert rule re-evaluates</span>
              </div>

              <div className={styles.advancedItem}>
                <label>Panels per dashboard</label>
                <input
                  type="number"
                  className={styles.inputField}
                  value={panelsPerDashboard}
                  onChange={(e) => setPanelsPerDashboard(e.target.value)}
                  min="0"
                />
                <span className={styles.inputHint}>avg query-emitting panels</span>
              </div>

              <div className={styles.advancedItem}>
                <label>Panel refresh (sec)</label>
                <input
                  type="number"
                  className={styles.inputField}
                  value={panelRefreshSec}
                  onChange={(e) => setPanelRefreshSec(e.target.value)}
                  min="1"
                />
                <span className={styles.inputHint}>dashboard auto-refresh interval</span>
              </div>

              <div className={styles.advancedItem}>
                <label>Dashboards open per engineer (peak)</label>
                <input
                  type="number"
                  className={styles.inputField}
                  value={dashboardConcurrency}
                  onChange={(e) => setDashboardConcurrency(e.target.value)}
                  min="0"
                  step="0.1"
                />
                <span className={styles.inputHint}>capped by total dashboards</span>
              </div>

              <div className={styles.advancedItem}>
                <label>Ad-hoc queries / engineer / hr</label>
                <input
                  type="number"
                  className={styles.inputField}
                  value={adhocQueriesPerEngineerPerHour}
                  onChange={(e) => setAdhoc(e.target.value)}
                  min="0"
                />
                <span className={styles.inputHint}>during peak hours</span>
              </div>

              <div className={styles.advancedItem}>
                <label>Peak hours / day</label>
                <input
                  type="number"
                  className={styles.inputField}
                  value={peakHoursPerDay}
                  onChange={(e) => setPeakHoursPerDay(e.target.value)}
                  min="0"
                  max="24"
                />
                <span className={styles.inputHint}>business-hour window</span>
              </div>

              <div className={styles.advancedItem}>
                <label>Peak days / week</label>
                <input
                  type="number"
                  className={styles.inputField}
                  value={peakDaysPerWeek}
                  onChange={(e) => setPeakDaysPerWeek(e.target.value)}
                  min="0"
                  max="7"
                />
                <span className={styles.inputHint}>typically 5</span>
              </div>

              <div className={styles.advancedItem}>
                <label>$ / pod-hour</label>
                <input
                  type="number"
                  className={styles.inputField}
                  value={costPerPodHourUsd}
                  onChange={(e) => setCostPerPodHourUsd(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <span className={styles.inputHint}>2 vCPU + 4 GiB on-demand</span>
              </div>

              <div className={styles.advancedItem}>
                <label>Headroom factor</label>
                <input
                  type="number"
                  className={styles.inputField}
                  value={headroomFactor}
                  onChange={(e) => setHeadroomFactor(e.target.value)}
                  min="1"
                  step="0.1"
                />
                <span className={styles.inputHint}>multiplier for slow queries, retries, latency variance</span>
              </div>

              <div className={styles.advancedItem}>
                <label>Min pod groups (HA)</label>
                <input
                  type="number"
                  className={styles.inputField}
                  value={minPodGroups}
                  onChange={(e) => setMinPodGroups(e.target.value)}
                  min="1"
                  step="1"
                />
                <span className={styles.inputHint}>floor for HA across AZs</span>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Estimated load</h3>

        <div className={styles.resultGrid}>
          <div className={`${styles.resultTile} ${styles.highlight}`}>
            <div className={styles.resultLabel}>Peak QPS</div>
            <div className={styles.resultValue}>{formatQps(r.peakQps)}</div>
            <div className={styles.resultSub}>business hours</div>
          </div>
          <div className={styles.resultTile}>
            <div className={styles.resultLabel}>Off-peak QPS</div>
            <div className={styles.resultValue}>{formatQps(r.offPeakQps)}</div>
            <div className={styles.resultSub}>alerts only</div>
          </div>
          <div className={styles.resultTile}>
            <div className={styles.resultLabel}>Peak pods</div>
            <div className={styles.resultValue}>{r.peakPods}</div>
            <div className={styles.resultSub}>{r.peakPods / QUERY_POD_GROUP_SIZE} × {QUERY_POD_GROUP_SIZE}-pod group</div>
          </div>
          <div className={styles.resultTile}>
            <div className={styles.resultLabel}>Off-peak pods</div>
            <div className={styles.resultValue}>{r.offPeakPods}</div>
            <div className={styles.resultSub}>{r.offPeakPods / QUERY_POD_GROUP_SIZE} × {QUERY_POD_GROUP_SIZE}-pod group</div>
          </div>
          <div className={`${styles.resultTile} ${styles.highlight}`}>
            <div className={styles.resultLabel}>Est. compute cost</div>
            <div className={styles.resultValue}>{formatUsd(r.monthlyCostUsd)}</div>
            <div className={styles.resultSub}>per month</div>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Regime</th>
                <th>QPS</th>
                <th>Pods</th>
                <th>vCPU</th>
                <th>Memory</th>
                <th>Hours / mo</th>
                <th>Cost / mo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Peak</strong> (business hours)</td>
                <td>{formatQps(r.peakQps)}</td>
                <td>{r.peakPods}</td>
                <td>{formatCpu(r.peakCpu)}</td>
                <td>{formatMemoryGi(r.peakMemoryMi)} Gi</td>
                <td>{Math.round(r.peakHoursPerMonth)}</td>
                <td>{formatUsd(r.peakMonthlyCostUsd)}</td>
              </tr>
              <tr className={styles.subRow}>
                <td>alerts</td>
                <td>{formatQps(r.alertQps)}</td>
                <td colSpan={5}></td>
              </tr>
              <tr className={styles.subRow}>
                <td>dashboards</td>
                <td>{formatQps(r.dashboardQps)}</td>
                <td colSpan={5}></td>
              </tr>
              <tr className={styles.subRow}>
                <td>ad-hoc</td>
                <td>{formatQps(r.adhocQps)}</td>
                <td colSpan={5}></td>
              </tr>
              <tr>
                <td><strong>Off-peak</strong> (alerts only)</td>
                <td>{formatQps(r.offPeakQps)}</td>
                <td>{r.offPeakPods}</td>
                <td>{formatCpu(r.offPeakCpu)}</td>
                <td>{formatMemoryGi(r.offPeakMemoryMi)} Gi</td>
                <td>{Math.round(r.offPeakHoursPerMonth)}</td>
                <td>{formatUsd(r.offPeakMonthlyCostUsd)}</td>
              </tr>
              <tr>
                <td><strong>Total</strong></td>
                <td colSpan={5}></td>
                <td><strong>{formatUsd(r.monthlyCostUsd)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>How this is computed</h3>
        <div className={styles.assumptions}>
          <p>Each pod is {QUERY_POD_CPU} vCPU + {formatMemoryGi(QUERY_POD_MEMORY_MI)} GiB. A {QUERY_POD_GROUP_SIZE}-pod group handles up to {QUERY_GROUP_QPS_CAPACITY} QPS at burst; we multiply expected QPS by a headroom factor (default {QUERY_SIZING_DEFAULTS.headroomFactor}×) to account for slow queries, retries, and latency variance, then round up to whole groups with a {QUERY_SIZING_DEFAULTS.minPodGroups}-group floor for HA across availability zones.</p>
          <ul>
            <li><strong>Alert QPS</strong> = alerts ÷ alert eval interval. Runs 24/7.</li>
            <li><strong>Dashboard QPS</strong> = min(dashboards, engineers × concurrency) × panels ÷ panel refresh. Peak only.</li>
            <li><strong>Ad-hoc QPS</strong> = engineers × queries per engineer per hour ÷ 3600. Peak only.</li>
            <li><strong>Effective QPS</strong> = raw QPS × headroom factor; pod groups = max(min groups, ⌈effective QPS ÷ {QUERY_GROUP_QPS_CAPACITY}⌉).</li>
            <li><strong>Cost</strong> = (peak pods × peak hours + off-peak pods × off-peak hours) × $/pod-hour, over a 4.345-week month.</li>
          </ul>
          <p>Defaults are calibrated to typical observability workloads; tune them under <em>Show assumptions</em> to match yours.</p>
        </div>
      </section>
    </div>
  );
}
