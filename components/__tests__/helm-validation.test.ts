import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  generateValuesYaml,
  createDefaultState,
  type WizardState,
} from '../../lib/generateValuesYaml';

// These tests validate that the wizard-generated YAML can be successfully
// templated with the actual Lakerunner helm chart using `helm template`.
// Uses the local chart at ../charts/lakerunner/ for speed.

const CHART_PATH = path.resolve(__dirname, '../../../charts/lakerunner');

describe('Helm Template Validation', () => {
  let tempDir: string;
  let chartAvailable: boolean;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lakerunner-test-'));
    chartAvailable = fs.existsSync(path.join(CHART_PATH, 'Chart.yaml'));
    if (!chartAvailable) {
      console.warn(`Skipping helm template tests: chart not found at ${CHART_PATH}`);
    }
  });

  afterAll(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function validateWithHelm(yamlContent: string, testName: string): { success: boolean; output: string; error: string } {
    const valuesFile = path.join(tempDir, `${testName}-values.yaml`);
    fs.writeFileSync(valuesFile, yamlContent);

    const result = spawnSync('helm', ['template', testName, CHART_PATH, '--values', valuesFile], {
      encoding: 'utf-8',
      timeout: 30000,
    });

    return {
      success: result.status === 0,
      output: result.stdout || '',
      error: result.stderr || '',
    };
  }

  function createValidAWSState(): WizardState {
    const state = createDefaultState();
    state.installType = 'poc';
    state.cloudProvider = 'aws';
    state.organizationId = 'b3a870ae-2c05-42b9-b073-572e718ad39d';
    state.collectorName = 'test-collector';
    state.apiKey = 'chq_test123456789012345678901234';
    state.storage = { bucket: 'test-bucket', region: 'us-east-1' };
    state.aws = {
      credentialMode: 'create',
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      existingSecretName: '',
    };
    state.lrdb = {
      credentialMode: 'create',
      host: 'lakerunner-db.example.com',
      port: '5432',
      database: 'lakerunner',
      username: 'lakerunner',
      password: 'testpassword123',
      sslMode: 'require',
      existingSecretName: '',
    };
    state.configdb = {
      credentialMode: 'create',
      host: 'config-db.example.com',
      port: '5432',
      database: 'configdb',
      username: 'lakerunner',
      password: 'testpassword456',
      sslMode: 'require',
      existingSecretName: '',
    };
    state.license = {
      mode: 'create',
      secretName: 'lakerunner-license',
      data: 'b64:dGVzdGxpY2Vuc2VkYXRh',
    };
    state.pubsub = {
      type: 'http',
      httpReplicas: '2',
      sqsReplicas: '2',
      sqsQueueURL: '',
      sqsRegion: '',
      sqsRoleARN: '',
      gcpReplicas: '1',
      gcpProjectID: '',
      gcpSubscriptionID: '',
    };
    state.scaling = { processLogsMax: '10', processMetricsMax: '10', processTracesMax: '10' };
    state.enableGrafana = true;
    state.enableCollector = true;
    return state;
  }

  function createValidGCPState(): WizardState {
    const state = createValidAWSState();
    state.cloudProvider = 'gcp';
    state.storage.region = 'us-central1';
    state.gcp = {
      credentialMode: 'workload_identity',
      serviceAccountJson: '',
      existingSecretName: '',
    };
    state.pubsub = {
      type: 'http',
      httpReplicas: '2',
      sqsReplicas: '2',
      sqsQueueURL: '',
      sqsRegion: '',
      sqsRoleARN: '',
      gcpReplicas: '1',
      gcpProjectID: 'my-project-123',
      gcpSubscriptionID: 'my-subscription',
    };
    return state;
  }

  function skipIfNoChart() {
    if (!chartAvailable) {
      return true;
    }
    return false;
  }

  describe('AWS + HTTP PubSub', () => {
    test('POC with AWS create credentials + HTTP pubsub', () => {
      if (skipIfNoChart()) return;

      const state = createValidAWSState();
      const yaml = generateValuesYaml(state);
      expect(yaml).not.toBeNull();

      const result = validateWithHelm(yaml!, 'aws-create-http');
      if (!result.success) console.error('Helm error:', result.error);
      expect(result.success).toBe(true);
      expect(result.output).toContain('kind: Deployment');
    }, 30000);

    test('POC with AWS existing secret + HTTP pubsub', () => {
      if (skipIfNoChart()) return;

      const state = createValidAWSState();
      state.aws.credentialMode = 'existing';
      state.aws.existingSecretName = 'aws-credentials';

      const yaml = generateValuesYaml(state);
      expect(yaml).not.toBeNull();

      const result = validateWithHelm(yaml!, 'aws-existing-http');
      if (!result.success) console.error('Helm error:', result.error);
      expect(result.success).toBe(true);
    }, 30000);

    test('POC with EKS IRSA + HTTP pubsub', () => {
      if (skipIfNoChart()) return;

      const state = createValidAWSState();
      state.aws.credentialMode = 'eks';

      const yaml = generateValuesYaml(state);
      expect(yaml).not.toBeNull();

      const result = validateWithHelm(yaml!, 'aws-eks-http');
      if (!result.success) console.error('Helm error:', result.error);
      expect(result.success).toBe(true);
    }, 30000);
  });

  describe('AWS + SQS PubSub', () => {
    test('POC with AWS create credentials + SQS pubsub', () => {
      if (skipIfNoChart()) return;

      const state = createValidAWSState();
      state.pubsub.type = 'sqs';
      state.pubsub.sqsQueueURL = 'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue';

      const yaml = generateValuesYaml(state);
      expect(yaml).not.toBeNull();

      const result = validateWithHelm(yaml!, 'aws-create-sqs');
      if (!result.success) console.error('Helm error:', result.error);
      expect(result.success).toBe(true);
    }, 30000);

    test('POC with EKS IRSA + SQS with roleARN', () => {
      if (skipIfNoChart()) return;

      const state = createValidAWSState();
      state.aws.credentialMode = 'eks';
      state.pubsub.type = 'sqs';
      state.pubsub.sqsQueueURL = 'https://sqs.us-east-2.amazonaws.com/123456789012/q';
      state.pubsub.sqsRegion = 'us-east-2';
      state.pubsub.sqsRoleARN = 'arn:aws:iam::123456789012:role/my-role';

      const yaml = generateValuesYaml(state);
      expect(yaml).not.toBeNull();

      const result = validateWithHelm(yaml!, 'aws-eks-sqs-role');
      if (!result.success) console.error('Helm error:', result.error);
      expect(result.success).toBe(true);
    }, 30000);
  });

  describe('GCP Configurations', () => {
    test('POC with GCP Workload Identity + GCP Pub/Sub', () => {
      if (skipIfNoChart()) return;

      const state = createValidGCPState();

      const yaml = generateValuesYaml(state);
      expect(yaml).not.toBeNull();

      const result = validateWithHelm(yaml!, 'gcp-workload-identity');
      if (!result.success) console.error('Helm error:', result.error);
      expect(result.success).toBe(true);
      expect(result.output).toContain('kind: Deployment');
    }, 30000);

    test('POC with GCP existing secret + GCP Pub/Sub', () => {
      if (skipIfNoChart()) return;

      const state = createValidGCPState();
      state.gcp.credentialMode = 'existing';
      state.gcp.existingSecretName = 'my-gcp-credentials';

      const yaml = generateValuesYaml(state);
      expect(yaml).not.toBeNull();

      const result = validateWithHelm(yaml!, 'gcp-existing');
      if (!result.success) console.error('Helm error:', result.error);
      expect(result.success).toBe(true);
    }, 30000);

    test('POC with GCP service account JSON + GCP Pub/Sub', () => {
      if (skipIfNoChart()) return;

      const state = createValidGCPState();
      state.gcp.credentialMode = 'service_account';
      state.gcp.serviceAccountJson = '{"type":"service_account","project_id":"test-project","private_key_id":"key123"}';

      const yaml = generateValuesYaml(state);
      expect(yaml).not.toBeNull();

      const result = validateWithHelm(yaml!, 'gcp-service-account');
      if (!result.success) console.error('Helm error:', result.error);
      expect(result.success).toBe(true);
    }, 30000);
  });

  describe('Production Configurations', () => {
    test('Production AWS with existing secrets + HTTP', () => {
      if (skipIfNoChart()) return;

      const state = createValidAWSState();
      state.installType = 'production';
      state.aws.credentialMode = 'existing';
      state.aws.existingSecretName = 'aws-credentials';
      state.lrdb.credentialMode = 'existing';
      state.lrdb.existingSecretName = 'lrdb-credentials';
      state.configdb.credentialMode = 'existing';
      state.configdb.existingSecretName = 'configdb-credentials';
      state.enableGrafana = false;

      const yaml = generateValuesYaml(state);
      expect(yaml).not.toBeNull();

      const result = validateWithHelm(yaml!, 'prod-aws-http');
      if (!result.success) console.error('Helm error:', result.error);
      expect(result.success).toBe(true);
    }, 30000);

    test('Production AWS with existing secrets + SQS', () => {
      if (skipIfNoChart()) return;

      const state = createValidAWSState();
      state.installType = 'production';
      state.aws.credentialMode = 'existing';
      state.aws.existingSecretName = 'aws-credentials';
      state.lrdb.credentialMode = 'existing';
      state.lrdb.existingSecretName = 'lrdb-credentials';
      state.configdb.credentialMode = 'existing';
      state.configdb.existingSecretName = 'configdb-credentials';
      state.pubsub.type = 'sqs';
      state.pubsub.sqsQueueURL = 'https://sqs.us-east-1.amazonaws.com/123456789012/q';
      state.enableGrafana = false;

      const yaml = generateValuesYaml(state);
      expect(yaml).not.toBeNull();

      const result = validateWithHelm(yaml!, 'prod-aws-sqs');
      if (!result.success) console.error('Helm error:', result.error);
      expect(result.success).toBe(true);
    }, 30000);

    test('Production GCP with workload identity', () => {
      if (skipIfNoChart()) return;

      const state = createValidGCPState();
      state.installType = 'production';
      state.lrdb.credentialMode = 'existing';
      state.lrdb.existingSecretName = 'lrdb-credentials';
      state.configdb.credentialMode = 'existing';
      state.configdb.existingSecretName = 'configdb-credentials';
      state.enableGrafana = false;

      const yaml = generateValuesYaml(state);
      expect(yaml).not.toBeNull();

      const result = validateWithHelm(yaml!, 'prod-gcp');
      if (!result.success) console.error('Helm error:', result.error);
      expect(result.success).toBe(true);
    }, 30000);
  });

  describe('License Configurations', () => {
    test('Inline license passes helm template', () => {
      if (skipIfNoChart()) return;

      const state = createValidAWSState();
      state.license = { mode: 'create', secretName: 'lakerunner-license', data: 'b64:dGVzdGxpY2Vuc2VkYXRh' };

      const yaml = generateValuesYaml(state);
      expect(yaml).not.toBeNull();

      const result = validateWithHelm(yaml!, 'license-inline');
      if (!result.success) console.error('Helm error:', result.error);
      expect(result.success).toBe(true);
    }, 30000);

    test('Existing license secret passes helm template', () => {
      if (skipIfNoChart()) return;

      const state = createValidAWSState();
      state.license = { mode: 'existing', secretName: 'my-license-secret', data: '' };

      const yaml = generateValuesYaml(state);
      expect(yaml).not.toBeNull();

      const result = validateWithHelm(yaml!, 'license-existing');
      if (!result.success) console.error('Helm error:', result.error);
      expect(result.success).toBe(true);
    }, 30000);
  });

  describe('Grafana Toggle', () => {
    test('Grafana enabled passes helm template', () => {
      if (skipIfNoChart()) return;

      const state = createValidAWSState();
      state.enableGrafana = true;

      const yaml = generateValuesYaml(state);
      expect(yaml).not.toBeNull();

      const result = validateWithHelm(yaml!, 'grafana-enabled');
      if (!result.success) console.error('Helm error:', result.error);
      expect(result.success).toBe(true);
    }, 30000);

    test('Grafana disabled passes helm template', () => {
      if (skipIfNoChart()) return;

      const state = createValidAWSState();
      state.enableGrafana = false;

      const yaml = generateValuesYaml(state);
      expect(yaml).not.toBeNull();

      const result = validateWithHelm(yaml!, 'grafana-disabled');
      if (!result.success) console.error('Helm error:', result.error);
      expect(result.success).toBe(true);
    }, 30000);
  });
});
