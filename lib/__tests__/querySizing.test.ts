import {
  calculateQuerySizing,
  QUERY_SIZING_DEFAULTS,
  QUERY_POD_GROUP_SIZE,
  QUERY_GROUP_QPS_CAPACITY,
  type QuerySizingInput,
} from '../sizingCalculations';

function withDefaults(overrides: Partial<QuerySizingInput> & Pick<QuerySizingInput, 'dashboards' | 'alerts' | 'engineers'>): QuerySizingInput {
  return { ...QUERY_SIZING_DEFAULTS, ...overrides };
}

describe('calculateQuerySizing — defaults shipped in the calculator', () => {
  it('defaults bias toward conservative sizing: headroom 3, min 2 groups, dense dashboards', () => {
    expect(QUERY_SIZING_DEFAULTS.headroomFactor).toBe(3.0);
    expect(QUERY_SIZING_DEFAULTS.minPodGroups).toBe(2);
    expect(QUERY_SIZING_DEFAULTS.panelsPerDashboard).toBe(12);
    expect(QUERY_SIZING_DEFAULTS.panelRefreshSec).toBe(20);
    expect(QUERY_SIZING_DEFAULTS.dashboardConcurrency).toBe(1.0);
  });

  it('small org (50/100/20) → constant 8 pods (HA floor binds)', () => {
    const r = calculateQuerySizing(withDefaults({ dashboards: 50, alerts: 100, engineers: 20 }));

    // alert QPS = 100/60 ≈ 1.67
    expect(r.alertQps).toBeCloseTo(100 / 60, 3);
    // concurrent dashboards = min(50, 20*1) = 20; dashboardQPS = 20*12/20 = 12
    expect(r.dashboardQps).toBeCloseTo(12, 3);
    // adhoc = 20*5/3600 ≈ 0.028
    expect(r.adhocQps).toBeCloseTo(100 / 3600, 3);

    // peak ≈ 13.7 QPS, off-peak ≈ 1.67 QPS
    // With headroom 3.0, both regimes still way under 30 QPS per group → HA floor binds.
    expect(r.peakPods).toBe(QUERY_POD_GROUP_SIZE * 2);
    expect(r.offPeakPods).toBe(QUERY_POD_GROUP_SIZE * 2);
  });

  it('mid org (200/500/50) → peak crosses 90 QPS effective → 4 groups; off-peak at HA floor', () => {
    const r = calculateQuerySizing(withDefaults({ dashboards: 200, alerts: 500, engineers: 50 }));

    // alert QPS = 500/60 ≈ 8.33
    expect(r.alertQps).toBeCloseTo(500 / 60, 2);
    // concurrent = min(200, 50) = 50; dashboardQPS = 50*12/20 = 30
    expect(r.dashboardQps).toBeCloseTo(30, 2);

    // peak ≈ 38.4 QPS × 3 headroom = 115.2 → 4 groups (16 pods)
    expect(r.peakPods).toBe(QUERY_POD_GROUP_SIZE * 4);
    // off-peak 8.33 × 3 = 25 → 1 group, but min 2 groups
    expect(r.offPeakPods).toBe(QUERY_POD_GROUP_SIZE * 2);
  });

  it('large org (500/1000/200) → 14 groups peak, 2 groups off-peak', () => {
    const r = calculateQuerySizing(withDefaults({ dashboards: 500, alerts: 1000, engineers: 200 }));

    // alert QPS = 1000/60 ≈ 16.67
    expect(r.alertQps).toBeCloseTo(1000 / 60, 2);
    // concurrent = min(500, 200) = 200; dashboardQPS = 200*12/20 = 120
    expect(r.dashboardQps).toBeCloseTo(120, 2);

    // peak ≈ 137 × 3 ≈ 411 → ceil(411/30) = 14 groups (56 pods)
    expect(r.peakPods).toBe(QUERY_POD_GROUP_SIZE * 14);
    // off-peak 16.67 × 3 = 50 → 2 groups (8 pods)
    expect(r.offPeakPods).toBe(QUERY_POD_GROUP_SIZE * 2);
  });

  it('zero inputs → HA floor at both regimes (min 2 groups)', () => {
    const r = calculateQuerySizing(withDefaults({ dashboards: 0, alerts: 0, engineers: 0 }));
    expect(r.peakQps).toBe(0);
    expect(r.offPeakQps).toBe(0);
    expect(r.peakPods).toBe(QUERY_POD_GROUP_SIZE * 2);
    expect(r.offPeakPods).toBe(QUERY_POD_GROUP_SIZE * 2);
    expect(r.monthlyCostUsd).toBeGreaterThan(0);
  });

  it('headroomFactor multiplies effective QPS before group sizing', () => {
    // alerts only → easy to reason about. 1000 alerts / 60 = 16.67 QPS.
    // With headroom 1.0, that's < 30 → 1 group, min 2 = 2 groups.
    const noHeadroom = calculateQuerySizing(withDefaults({
      dashboards: 0, alerts: 1000, engineers: 0,
      headroomFactor: 1.0, minPodGroups: 1,
    }));
    expect(noHeadroom.offPeakPods).toBe(QUERY_POD_GROUP_SIZE * 1);

    // With headroom 2.0, that's 33.3 → 2 groups.
    const x2 = calculateQuerySizing(withDefaults({
      dashboards: 0, alerts: 1000, engineers: 0,
      headroomFactor: 2.0, minPodGroups: 1,
    }));
    expect(x2.offPeakPods).toBe(QUERY_POD_GROUP_SIZE * 2);
  });

  it('minPodGroups enforces HA floor even at zero load', () => {
    const r = calculateQuerySizing(withDefaults({
      dashboards: 0, alerts: 0, engineers: 0,
      headroomFactor: 1.0, minPodGroups: 3,
    }));
    expect(r.peakPods).toBe(QUERY_POD_GROUP_SIZE * 3);
    expect(r.offPeakPods).toBe(QUERY_POD_GROUP_SIZE * 3);
  });

  it('crosses the 30-QPS-per-group threshold cleanly', () => {
    const cap = QUERY_GROUP_QPS_CAPACITY;
    // headroom 1.0, min 1 to isolate the group-boundary behavior.
    // alerts = 60 * (cap - 1) ≈ just under 1 group with 60s interval
    const justUnder = calculateQuerySizing(withDefaults({
      dashboards: 0, alerts: 60 * (cap - 1), engineers: 0,
      headroomFactor: 1.0, minPodGroups: 1,
    }));
    expect(justUnder.offPeakPods).toBe(QUERY_POD_GROUP_SIZE);

    const justOver = calculateQuerySizing(withDefaults({
      dashboards: 0, alerts: 60 * (cap + 1), engineers: 0,
      headroomFactor: 1.0, minPodGroups: 1,
    }));
    expect(justOver.offPeakPods).toBe(QUERY_POD_GROUP_SIZE * 2);
  });

  it('hours per month: peak + off-peak ≈ 730.6 (24/7 coverage)', () => {
    const r = calculateQuerySizing(withDefaults({ dashboards: 0, alerts: 0, engineers: 0 }));
    expect(r.peakHoursPerMonth + r.offPeakHoursPerMonth).toBeCloseTo(168 * 4.345, 1);
  });

  it('custom alert interval scales alert QPS inversely', () => {
    const fast = calculateQuerySizing(withDefaults({ dashboards: 0, alerts: 60, engineers: 0, alertEvalIntervalSec: 10 }));
    const slow = calculateQuerySizing(withDefaults({ dashboards: 0, alerts: 60, engineers: 0, alertEvalIntervalSec: 60 }));
    expect(fast.alertQps).toBeCloseTo(slow.alertQps * 6, 3);
  });

  it('cost scales linearly with $/pod-hour', () => {
    const cheap = calculateQuerySizing(withDefaults({ dashboards: 100, alerts: 100, engineers: 50, costPerPodHourUsd: 0.06 }));
    const pricey = calculateQuerySizing(withDefaults({ dashboards: 100, alerts: 100, engineers: 50, costPerPodHourUsd: 0.12 }));
    expect(pricey.monthlyCostUsd).toBeCloseTo(cheap.monthlyCostUsd * 2, 2);
  });

  it('concurrentDashboards capped by dashboards count', () => {
    // 1 dashboard, 1000 engineers → cap binds to 1
    const r = calculateQuerySizing(withDefaults({ dashboards: 1, alerts: 0, engineers: 1000 }));
    // dashboardQps = 1 * 12 / 20 = 0.6
    expect(r.dashboardQps).toBeCloseTo(1 * 12 / 20, 3);
  });

  it('cost ballpark check on the documented scenarios (cost-per-pod-hour=$0.06)', () => {
    const small = calculateQuerySizing(withDefaults({ dashboards: 50, alerts: 100, engineers: 20 }));
    const mid = calculateQuerySizing(withDefaults({ dashboards: 200, alerts: 500, engineers: 50 }));
    const large = calculateQuerySizing(withDefaults({ dashboards: 500, alerts: 1000, engineers: 200 }));

    // Sanity bands so accidental regressions to the calc are visible.
    expect(small.monthlyCostUsd).toBeGreaterThan(300);
    expect(small.monthlyCostUsd).toBeLessThan(450);

    expect(mid.monthlyCostUsd).toBeGreaterThan(400);
    expect(mid.monthlyCostUsd).toBeLessThan(550);

    expect(large.monthlyCostUsd).toBeGreaterThan(900);
    expect(large.monthlyCostUsd).toBeLessThan(1100);
  });
});
