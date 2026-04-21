import { chromium } from 'playwright';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const artifactsDir = path.resolve(__dirname, '../.playwright-artifacts');
mkdirSync(artifactsDir, { recursive: true });

const URL_BASE = process.env.WIZARD_URL || 'http://localhost:3000/lakerunner/collectors';

function assert(cond, message) {
  if (!cond) throw new Error(`assertion failed: ${message}`);
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

  console.log(`Loading ${URL_BASE}`);
  await page.goto(URL_BASE, { waitUntil: 'networkidle' });

  // 1. The three wizard section headings render.
  const headings = ['Identity', 'S3 Destination', 'Credentials', 'Generated Overlay'];
  for (const h of headings) {
    const locator = page.getByRole('heading', { level: 3, name: h });
    await locator.waitFor({ state: 'visible', timeout: 10_000 });
  }
  console.log('✓ wizard sections render');

  // 2. With no input, the "complete all required fields" prompt is shown.
  const prompt = page.getByText(/Please complete all required fields/i);
  await prompt.waitFor({ state: 'visible' });
  console.log('✓ initial state shows configure prompt');

  // 3. Generate org ID, fill all required fields.
  await page.getByRole('button', { name: 'Generate' }).click();
  const orgInput = page.locator('input[placeholder*="xxxxxxxx-xxxx"]');
  const orgVal = await orgInput.inputValue();
  assert(/^[0-9a-f-]{36}$/.test(orgVal), `org id should be UUID, got "${orgVal}"`);

  await page.locator('input[placeholder="prod-us-east"]').fill('test-cluster');
  await page.locator('input[placeholder="my-lakerunner-bucket"]').fill('my-test-bucket');
  await page.locator('input[placeholder="us-east-1"]').fill('us-east-1');
  await page.locator('input[placeholder="AKIA..."]').fill('AKIAIOSFODNN7EXAMPLE');
  await page.locator('input[placeholder="••••••••"]').fill('wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
  console.log('✓ filled required fields');

  const tabs = page.getByTestId('collector-wizard-tabs');
  const output = page.getByTestId('collector-wizard-output');

  // 4. Output area should now show file tabs including kustomization.yaml + secret.
  await tabs.getByRole('button', { name: 'kustomization.yaml' }).waitFor({ state: 'visible', timeout: 5_000 });
  await tabs.getByRole('button', { name: 'aws-credentials.secret.yaml' }).waitFor({ state: 'visible' });
  console.log('✓ tabs render for static-creds overlay');

  // 5. Switch to kustomization tab and verify content contains secretGenerator.
  await tabs.getByRole('button', { name: 'kustomization.yaml' }).click();
  const kustText = await output.textContent();
  assert(kustText?.includes('secretGenerator'), `expected secretGenerator in output, got: ${kustText?.slice(0, 200)}`);
  assert(kustText?.includes('namespace: collector'), 'kustomization should have default namespace');
  assert(kustText?.includes('AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE'), 'kustomization should include access key literal');
  console.log('✓ kustomization content correct for static mode');

  // 6. Switch to IRSA — secretGenerator disappears, role ARN required.
  await page.getByRole('button', { name: 'IRSA / IAM Role' }).click();

  // With blank role ARN, the overlay should become invalid and show the prompt again.
  await page.getByText(/Please complete all required fields/i).waitFor({ state: 'visible', timeout: 5_000 });

  await page.locator('input[placeholder*="arn:aws:iam"]').fill('arn:aws:iam::123456789012:role/collector-gateway');
  await tabs.getByRole('button', { name: 'kustomization.yaml' }).waitFor({ state: 'visible' });
  await tabs.getByRole('button', { name: 'kustomization.yaml' }).click();
  const kustIrsa = await output.textContent();
  assert(!kustIrsa?.includes('secretGenerator'), 'IRSA mode should omit secretGenerator');
  console.log('✓ IRSA mode removes secretGenerator');

  // 7. Gateway patch should contain the role ARN.
  await tabs.getByRole('button', { name: 'patch-collector-gateway.yaml' }).click();
  const gatewayText = await output.textContent();
  assert(
    gatewayText?.includes('arn:aws:iam::123456789012:role/collector-gateway'),
    'gateway patch should contain role ARN',
  );
  assert(gatewayText?.includes('LAKERUNNER_ORGANIZATION_ID'), 'gateway patch should set org id env');
  assert(gatewayText?.includes(`value: "${orgVal}"`), 'gateway patch should reference generated org id');
  console.log('✓ gateway patch contains org id + role ARN');

  // 8. Validation feedback: invalid cluster name shows error text.
  await page.locator('input[placeholder="prod-us-east"]').fill('INVALID_NAME');
  await page.getByText(/DNS label/i).waitFor({ state: 'visible', timeout: 5_000 });
  console.log('✓ cluster name validation surfaces error message');
  // restore
  await page.locator('input[placeholder="prod-us-east"]').fill('test-cluster');

  // Screenshot for manual inspection.
  await page.screenshot({ path: path.join(artifactsDir, 'wizard.png'), fullPage: true });
  console.log(`✓ screenshot saved to ${path.join(artifactsDir, 'wizard.png')}`);

  if (consoleErrors.length > 0) {
    console.error('Console errors during run:');
    for (const e of consoleErrors) console.error(`  - ${e}`);
    throw new Error(`${consoleErrors.length} console error(s) during wizard run`);
  }

  await browser.close();
  console.log('\nALL CHECKS PASSED');
}

run().catch((err) => {
  console.error('\nFAILED:', err.message);
  process.exit(1);
});
