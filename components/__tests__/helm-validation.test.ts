import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// These tests validate that the wizard generates YAML that can be successfully
// templated with the actual LakeRunner helm chart using `helm template`

describe('Helm Template Validation', () => {
  const CHART_URL = 'oci://public.ecr.aws/cardinalhq.io/lakerunner';
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lakerunner-test-'));
  });

  afterAll(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function validateWithHelm(yamlContent: string, testName: string): { success: boolean; output: string; error: string } {
    const valuesFile = path.join(tempDir, `${testName}-values.yaml`);
    fs.writeFileSync(valuesFile, yamlContent);

    const result = spawnSync('helm', ['template', testName, CHART_URL, '--values', valuesFile], {
      encoding: 'utf-8',
      timeout: 30000,
    });

    return {
      success: result.status === 0,
      output: result.stdout || '',
      error: result.stderr || '',
    };
  }

  test('POC configuration passes helm template validation', () => {
    const valuesYaml = `# LakeRunner POC Configuration
global:
  autoscaling:
    mode: "keda"

apiKeys:
  source: config
  secretName: "apikeys"
  create: true
  yaml:
    - organization_id: "b3a870ae-2c05-42b9-b073-572e718ad39d"
      keys:
        - "chq_test123456789012345678901234"
        - "chq_grafana123456789012345678901"

cloudProvider:
  provider: "aws"
  aws:
    region: "us-east-1"
    inject: true
    create: true
    accessKeyId: "AKIAIOSFODNN7EXAMPLE"
    secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

storageProfiles:
  source: config
  create: true
  yaml:
    - organization_id: "b3a870ae-2c05-42b9-b073-572e718ad39d"
      collector_name: "test-collector"
      cloud_provider: "aws"
      region: "us-east-1"
      bucket: "test-bucket"

database:
  create: true
  lrdb:
    host: "lakerunner-db.example.com"
    port: 5432
    name: "lakerunner"
    username: "lakerunner"
    password: "testpassword123"
    sslMode: "require"

configdb:
  create: true
  lrdb:
    host: "config-db.example.com"
    port: 5432
    name: "configdb"
    username: "lakerunner"
    password: "testpassword456"
    sslMode: "require"

kafka:
  create: true
  brokers: "kafka-1:9092,kafka-2:9092,kafka-3:9092"
  sasl:
    enabled: true
    mechanism: "SCRAM-SHA-256"
    username: "kafka-user"
    password: "kafkapassword789"
  tls:
    enabled: true

grafana:
  enabled: true
  cardinal:
    apiKey: "chq_grafana123456789012345678901"

collector:
  enabled: true
`;

    const result = validateWithHelm(valuesYaml, 'poc-test');

    if (!result.success) {
      console.error('Helm template error:', result.error);
    }

    expect(result.success).toBe(true);
    expect(result.output).toContain('kind: Deployment');
    expect(result.output).toContain('kind: Service');
  }, 60000); // 60 second timeout for helm operations

  test('Production with existing secrets passes helm template validation', () => {
    const valuesYaml = `# LakeRunner Production Configuration
global:
  autoscaling:
    mode: "keda"

apiKeys:
  source: config
  secretName: "apikeys"
  create: true
  yaml:
    - organization_id: "a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7"
      keys:
        - "chq_prod123456789012345678901234"

cloudProvider:
  provider: "aws"
  aws:
    region: "us-west-2"
    inject: true
    create: false
    secretName: "aws-credentials"

storageProfiles:
  source: config
  create: true
  yaml:
    - organization_id: "a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7"
      collector_name: "prod-collector"
      cloud_provider: "aws"
      region: "us-west-2"
      bucket: "prod-bucket"

database:
  create: false
  secretName: "lrdb-credentials"
  lrdb:
    host: "prod-lrdb.example.com"
    port: 5432
    name: "lakerunner"
    username: "lakerunner"
    sslMode: "verify-full"

configdb:
  create: false
  secretName: "configdb-credentials"
  lrdb:
    host: "prod-configdb.example.com"
    port: 5432
    name: "configdb"
    username: "lakerunner"
    sslMode: "verify-full"

kafka:
  create: false
  secretName: "kafka-credentials"
  brokers: "kafka-prod-1:9092,kafka-prod-2:9092"
  sasl:
    enabled: true
    mechanism: "SCRAM-SHA-512"
  tls:
    enabled: true

grafana:
  enabled: false

collector:
  enabled: true
`;

    const result = validateWithHelm(valuesYaml, 'prod-test');

    if (!result.success) {
      console.error('Helm template error:', result.error);
    }

    expect(result.success).toBe(true);
    expect(result.output).toContain('kind: Deployment');
  }, 60000);

  test('EKS IRSA configuration passes helm template validation', () => {
    const valuesYaml = `# LakeRunner EKS IRSA Configuration
global:
  autoscaling:
    mode: "keda"

apiKeys:
  source: config
  secretName: "apikeys"
  create: true
  yaml:
    - organization_id: "b3a870ae-2c05-42b9-b073-572e718ad39d"
      keys:
        - "chq_test123456789012345678901234"

cloudProvider:
  provider: "aws"
  aws:
    region: "us-east-1"
    inject: false
    create: false

storageProfiles:
  source: config
  create: true
  yaml:
    - organization_id: "b3a870ae-2c05-42b9-b073-572e718ad39d"
      collector_name: "eks-collector"
      cloud_provider: "aws"
      region: "us-east-1"
      bucket: "eks-bucket"

database:
  create: true
  lrdb:
    host: "lakerunner-db.example.com"
    port: 5432
    name: "lakerunner"
    username: "lakerunner"
    password: "testpassword123"
    sslMode: "require"

configdb:
  create: true
  lrdb:
    host: "config-db.example.com"
    port: 5432
    name: "configdb"
    username: "lakerunner"
    password: "testpassword456"
    sslMode: "require"

kafka:
  create: true
  brokers: "kafka-1:9092"
  sasl:
    enabled: true
    mechanism: "PLAIN"
    username: "kafka-user"
    password: "kafkapassword789"
  tls:
    enabled: false

grafana:
  enabled: false

collector:
  enabled: true
`;

    const result = validateWithHelm(valuesYaml, 'eks-test');

    if (!result.success) {
      console.error('Helm template error:', result.error);
    }

    expect(result.success).toBe(true);
  }, 60000);

  test('Configuration without KEDA passes helm template validation', () => {
    const valuesYaml = `# LakeRunner Configuration without KEDA
global:
  autoscaling:
    mode: "disabled"

apiKeys:
  source: config
  secretName: "apikeys"
  create: true
  yaml:
    - organization_id: "b3a870ae-2c05-42b9-b073-572e718ad39d"
      keys:
        - "chq_test123456789012345678901234"

cloudProvider:
  provider: "aws"
  aws:
    region: "us-east-1"
    inject: true
    create: true
    accessKeyId: "AKIAIOSFODNN7EXAMPLE"
    secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

storageProfiles:
  source: config
  create: true
  yaml:
    - organization_id: "b3a870ae-2c05-42b9-b073-572e718ad39d"
      collector_name: "no-keda-collector"
      cloud_provider: "aws"
      region: "us-east-1"
      bucket: "test-bucket"

database:
  create: true
  lrdb:
    host: "lakerunner-db.example.com"
    port: 5432
    name: "lakerunner"
    username: "lakerunner"
    password: "testpassword123"
    sslMode: "require"

configdb:
  create: true
  lrdb:
    host: "config-db.example.com"
    port: 5432
    name: "configdb"
    username: "lakerunner"
    password: "testpassword456"
    sslMode: "require"

kafka:
  create: true
  brokers: "kafka-1:9092"
  sasl:
    enabled: true
    mechanism: "PLAIN"
    username: "kafka-user"
    password: "kafkapassword789"
  tls:
    enabled: false

grafana:
  enabled: false

collector:
  enabled: true
`;

    const result = validateWithHelm(valuesYaml, 'no-keda-test');

    if (!result.success) {
      console.error('Helm template error:', result.error);
    }

    expect(result.success).toBe(true);
    // Should not contain ScaledObject when KEDA disabled
    expect(result.output).not.toContain('kind: ScaledObject');
  }, 60000);
});
