import { chromium } from 'playwright';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const artifactsDir = path.resolve(__dirname, '../.playwright-artifacts');
mkdirSync(artifactsDir, { recursive: true });

const URL_BASE = process.env.WIZARD_URL || 'http://localhost:3000/lakerunner/collectors';

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') pageErrors.push(`console.error: ${msg.text()}`);
  });

  console.log(`Loading ${URL_BASE}`);
  await page.goto(URL_BASE, { waitUntil: 'networkidle' });

  const headings = [
    'Using Grafana Alloy',
    'How it works',
    'Tradeoffs',
    'Example Alloy configuration',
    'Notes and caveats',
  ];
  for (const name of headings) {
    const locator = page.getByRole('heading', { name });
    await locator.waitFor({ state: 'visible', timeout: 10_000 });
  }
  console.log('✓ Alloy section headings present');

  // Verify the code fence with the exporter config made it through MDX without being
  // treated as JSX (which would swallow ${K8S_CLUSTER_NAME}).
  const alloyBlock = page.locator('pre', {
    hasText: 'otelcol.exporter.awss3',
  });
  await alloyBlock.first().waitFor({ state: 'visible' });
  const text = (await alloyBlock.first().textContent()) ?? '';
  for (const needle of [
    'otelcol.receiver.otlp',
    'otelcol.processor.k8sattributes',
    'otelcol.processor.cumulativetodelta',
    'sys.env("LAKERUNNER_ORGANIZATION_ID")',
    'sys.env("K8S_CLUSTER_NAME")',
    'marshaler',
    's3_prefix',
  ]) {
    if (!text.includes(needle)) {
      throw new Error(`Alloy config block missing expected token: ${needle}`);
    }
  }
  console.log('✓ Alloy config code block is intact (no MDX interpolation corruption)');

  await page.screenshot({ path: path.join(artifactsDir, 'alloy-section.png'), fullPage: true });

  if (pageErrors.length) {
    for (const err of pageErrors) console.error(err);
    throw new Error(`${pageErrors.length} page/console error(s)`);
  }

  await browser.close();
  console.log('\nALL CHECKS PASSED');
}

run().catch((err) => {
  console.error('\nFAILED:', err.message);
  process.exit(1);
});
