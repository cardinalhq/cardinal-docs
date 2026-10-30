import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export type Node = Record<string, unknown>;

export const CHART_PATH = path.resolve(__dirname, '../../../charts/lakerunner');

/** The chart's values.yaml. CI must have the chart; elsewhere a missing chart only skips. */
export function loadChartValues(): Node | null {
  const valuesPath = path.join(CHART_PATH, 'values.yaml');
  if (fs.existsSync(valuesPath)) return yaml.load(fs.readFileSync(valuesPath, 'utf8')) as Node;
  if (process.env.CI) throw new Error(`chart not found at ${CHART_PATH}`);
  console.warn(`Skipping chart checks: chart not found at ${CHART_PATH}`);
  return null;
}

export function missingKeys(block: Node, chart: Node, prefix = ''): string[] {
  return Object.entries(block).flatMap(([key, value]) => {
    const keyPath = `${prefix}${key}`;
    if (!(key in chart)) return [keyPath];
    // Arrays such as storageProfiles.yaml are free-form in values.yaml.
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return [];
    return missingKeys(value as Node, (chart[key] ?? {}) as Node, `${keyPath}.`);
  });
}
