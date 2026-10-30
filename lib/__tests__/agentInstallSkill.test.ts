/**
 * Keeps the agent install skill in step with the Helm chart: every values key
 * and chart path it names must exist in the chart's values.yaml, and its values
 * must render. Needs a checkout at ../charts; CI provides one, so a missing
 * chart only skips locally.
 */

import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { CHART_PATH, loadChartValues, missingKeys, type Node } from './chartValues';

const SKILL = fs.readFileSync(path.resolve(__dirname, '../../public/data-lake/agent-install.md'), 'utf8');
const VALUES_BLOCK = SKILL.match(/```yaml\n(license:[\s\S]*?)```/)![1];
const SQS_OVERLAY = SKILL.split('#### AWS S3 + SQS overlay')[1].match(/```yaml\n([\s\S]*?)```/)![1];
const GCP_OVERLAY = SKILL.split('#### Google GCS + Pub/Sub overlay')[1].match(/```yaml\n([\s\S]*?)```/)![1];

function hasPath(chart: Node, dotted: string): boolean {
  let node: unknown = chart;
  for (const key of dotted.split('.')) {
    if (node === null || typeof node !== 'object' || !(key in node)) return false;
    node = (node as Node)[key];
  }
  return true;
}

describe('agent install skill', () => {
  test('has the frontmatter a skill needs', () => {
    const frontmatter = yaml.load(SKILL.match(/^---\n([\s\S]*?)\n---\n/)![1]) as Node;
    expect(frontmatter.name).toBe('install-cardinal-data-lake');
    expect(frontmatter.description).toBeTruthy();
  });

  test('nests collector notifications under s3uploader', () => {
    const snippet = yaml.load(SKILL.match(/```yaml\n(exporters:[\s\S]*?)```/)![1]) as {
      exporters: { awss3: { s3uploader: { notifications: { endpoint: string } } } };
    };
    expect(snippet.exporters.awss3.s3uploader.notifications.endpoint).toContain('-pubsub-http.');
  });

  test('values keys exist in the chart', () => {
    const chart = loadChartValues();
    if (!chart) return;
    for (const block of [VALUES_BLOCK, SQS_OVERLAY, GCP_OVERLAY]) {
      expect(missingKeys(yaml.load(block) as Node, chart)).toEqual([]);
    }
  });

  test('chart paths named in the prose exist in the chart', () => {
    const chart = loadChartValues();
    if (!chart) return;
    const paths = Array.from(SKILL.matchAll(/`((?:global|setup|process|queryWorker|pubsub|grafana)\.[\w.]+)`/g), (m) => m[1]);
    expect(paths.length).toBeGreaterThan(0);
    expect(paths.filter((p) => !hasPath(chart, p))).toEqual([]);
  });

  test.each([
    { route: 'http', overlay: '', receiver: 'pubsub-http' },
    { route: 'sqs', overlay: SQS_OVERLAY, receiver: 'pubsub-sqs' },
    { route: 'gcp', overlay: GCP_OVERLAY, receiver: 'pubsub-gcp' },
  ])('$route values render the selected receiver and credential references', ({ route, overlay, receiver }) => {
    if (!loadChartValues()) return;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-install-'));
    try {
      // The AWS instructions explicitly remove the custom S3 endpoint.
      const base = route === 'sqs' ? VALUES_BLOCK.replace(/^      endpoint:.*\n/m, '') : VALUES_BLOCK;
      const fill = (block: string) => block.replace(/<port>/g, '5432').replace(/<[^>\n]+>/g, 'placeholder');
      const file = path.join(dir, 'values.yaml');
      const providerFile = path.join(dir, 'provider.yaml');
      fs.writeFileSync(file, fill(base));
      fs.writeFileSync(providerFile, fill(overlay));
      const result = spawnSync('helm', ['template', 'lakerunner', CHART_PATH, '--namespace', 'lakerunner', '--values', file, '--values', providerFile], {
        encoding: 'utf-8',
        timeout: 30000,
        maxBuffer: 64 * 1024 * 1024,
      });
      expect(result.stderr).toBe('');
      expect(result.status).toBe(0);
      for (const secret of ['lakerunner-license', 'lakerunner-apikeys', 'lakerunner-db']) {
        expect(result.stdout).toContain(`: ${secret}`);
      }
      const manifests = yaml.loadAll(result.stdout) as Node[];
      const deployments = manifests.filter((doc) => doc?.kind === 'Deployment');
      const receivers = deployments.filter((doc) => /-pubsub-/.test((doc.metadata as Node).name as string));
      expect(receivers.map((doc) => (doc.metadata as Node).name)).toEqual([`lakerunner-${receiver}`]);
      if (route === 'gcp') {
        expect(result.stdout).not.toContain(': lakerunner-s3');
        expect(result.stdout).toContain('name: GCP_PROJECT_ID');
        expect(result.stdout).toContain('name: GCP_SUBSCRIPTION_ID');
        const profiles = manifests.find((doc) => doc?.kind === 'ConfigMap' &&
          Object.values((doc.data as Node) ?? {}).some((value) => typeof value === 'string' && value.includes('cloud_provider: gcp')));
        expect(profiles).toBeDefined();
        expect(JSON.stringify(profiles)).not.toContain('endpoint:');
      } else {
        expect(result.stdout).toContain(': lakerunner-s3');
      }
      if (route === 'sqs') expect(result.stdout).toContain('name: SQS_QUEUE_URL');
      expect(result.stdout).toContain('name: lakerunner-query-api');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 30000);
});
