import {
  generateValuesYaml,
  createDefaultState,
  isValidCollectorName,
  isValidUUID,
  isValidPort,
  isValidLicenseData,
  type WizardState,
} from '../generateValuesYaml';

// Helper to create a valid base state for AWS
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
  state.enableGrafana = true;
  state.enableCollector = true;
  return state;
}

// Helper to create a valid base state for GCP
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

describe('Validation Functions', () => {
  describe('isValidCollectorName', () => {
    test('rejects empty string', () => {
      expect(isValidCollectorName('')).toBe(false);
      expect(isValidCollectorName('   ')).toBe(false);
    });

    test('rejects "default" in any case', () => {
      expect(isValidCollectorName('default')).toBe(false);
      expect(isValidCollectorName('Default')).toBe(false);
      expect(isValidCollectorName('DEFAULT')).toBe(false);
      expect(isValidCollectorName(' default ')).toBe(false);
    });

    test('accepts valid collector names', () => {
      expect(isValidCollectorName('my-collector')).toBe(true);
      expect(isValidCollectorName('test-collector')).toBe(true);
      expect(isValidCollectorName('prod-collector-1')).toBe(true);
    });
  });

  describe('isValidUUID', () => {
    test('accepts valid UUIDs', () => {
      expect(isValidUUID('b3a870ae-2c05-42b9-b073-572e718ad39d')).toBe(true);
      expect(isValidUUID('a1b2c3d4-e5f6-4789-a0b1-c2d3e4f5a6b7')).toBe(true);
    });

    test('rejects invalid UUIDs', () => {
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('12345678-1234-1234-1234')).toBe(false);
    });
  });

  describe('isValidPort', () => {
    test('accepts valid ports', () => {
      expect(isValidPort('1')).toBe(true);
      expect(isValidPort('80')).toBe(true);
      expect(isValidPort('5432')).toBe(true);
      expect(isValidPort('65535')).toBe(true);
    });

    test('rejects invalid ports', () => {
      expect(isValidPort('0')).toBe(false);
      expect(isValidPort('-1')).toBe(false);
      expect(isValidPort('65536')).toBe(false);
      expect(isValidPort('abc')).toBe(false);
      expect(isValidPort('')).toBe(false);
    });
  });

  describe('isValidLicenseData', () => {
    test('accepts b64: prefix', () => {
      expect(isValidLicenseData('b64:dGVzdA==')).toBe(true);
    });

    test('accepts z64: prefix', () => {
      expect(isValidLicenseData('z64:dGVzdA==')).toBe(true);
    });

    test('rejects empty string', () => {
      expect(isValidLicenseData('')).toBe(false);
    });

    test('rejects data without valid prefix', () => {
      expect(isValidLicenseData('dGVzdA==')).toBe(false);
      expect(isValidLicenseData('x64:dGVzdA==')).toBe(false);
    });
  });
});

describe('generateValuesYaml', () => {
  describe('License Configuration', () => {
    test('generates inline license with create mode', () => {
      const state = createValidAWSState();

      const yaml = generateValuesYaml(state);

      expect(yaml).not.toBeNull();
      expect(yaml).toContain('license:');
      expect(yaml).toContain('create: true');
      expect(yaml).toContain('data: "b64:dGVzdGxpY2Vuc2VkYXRh"');
    });

    test('generates existing secret license', () => {
      const state = createValidAWSState();
      state.license = { mode: 'existing', secretName: 'my-license-secret', data: '' };

      const yaml = generateValuesYaml(state);

      expect(yaml).not.toBeNull();
      expect(yaml).toContain('license:');
      expect(yaml).toContain('create: false');
      expect(yaml).toContain('secretName: "my-license-secret"');
    });

    test('returns null when license data missing for create mode', () => {
      const state = createValidAWSState();
      state.license = { mode: 'create', secretName: 'lakerunner-license', data: '' };

      expect(generateValuesYaml(state)).toBeNull();
    });

    test('returns null when license data has wrong prefix', () => {
      const state = createValidAWSState();
      state.license = { mode: 'create', secretName: 'lakerunner-license', data: 'invalid-data' };

      expect(generateValuesYaml(state)).toBeNull();
    });

    test('returns null when existing secret name empty', () => {
      const state = createValidAWSState();
      state.license = { mode: 'existing', secretName: '', data: '' };

      expect(generateValuesYaml(state)).toBeNull();
    });
  });

  describe('AWS Cloud Provider', () => {
    test('generates EKS IRSA config (inject: false, create: false)', () => {
      const state = createValidAWSState();
      state.aws.credentialMode = 'eks';

      const yaml = generateValuesYaml(state);

      expect(yaml).not.toBeNull();
      expect(yaml).toContain('provider: "aws"');
      expect(yaml).toContain('inject: false');
      expect(yaml).toContain('create: false');
      expect(yaml).not.toContain('accessKeyId');
    });

    test('generates existing secret config (inject: true, create: false, secretName)', () => {
      const state = createValidAWSState();
      state.aws.credentialMode = 'existing';
      state.aws.existingSecretName = 'my-aws-secret';

      const yaml = generateValuesYaml(state);

      expect(yaml).not.toBeNull();
      expect(yaml).toContain('provider: "aws"');
      expect(yaml).toContain('inject: true');
      expect(yaml).toContain('create: false');
      expect(yaml).toContain('secretName: "my-aws-secret"');
      expect(yaml).not.toContain('accessKeyId');
    });

    test('generates create secret config (inject: true, create: true, credentials)', () => {
      const state = createValidAWSState();
      state.aws.credentialMode = 'create';

      const yaml = generateValuesYaml(state);

      expect(yaml).not.toBeNull();
      expect(yaml).toContain('provider: "aws"');
      expect(yaml).toContain('inject: true');
      expect(yaml).toContain('create: true');
      expect(yaml).toContain('accessKeyId: "AKIAIOSFODNN7EXAMPLE"');
      expect(yaml).toContain('secretAccessKey:');
    });
  });

  describe('GCP Cloud Provider', () => {
    test('generates Workload Identity config (inject: false, create: false)', () => {
      const state = createValidGCPState();

      const yaml = generateValuesYaml(state);

      expect(yaml).not.toBeNull();
      expect(yaml).toContain('provider: "gcp"');
      expect(yaml).toContain('gcp:');
      expect(yaml).toContain('inject: false');
      expect(yaml).toContain('create: false');
      expect(yaml).not.toContain('serviceAccountJson');
    });

    test('generates existing secret config (inject: true, create: false, secretName)', () => {
      const state = createValidGCPState();
      state.gcp = {
        credentialMode: 'existing',
        serviceAccountJson: '',
        existingSecretName: 'my-gcp-credentials',
      };

      const yaml = generateValuesYaml(state);

      expect(yaml).not.toBeNull();
      expect(yaml).toContain('provider: "gcp"');
      expect(yaml).toContain('inject: true');
      expect(yaml).toContain('create: false');
      expect(yaml).toContain('secretName: "my-gcp-credentials"');
      expect(yaml).not.toContain('serviceAccountJson');
    });

    test('generates service account JSON config (inject: true, create: true, serviceAccountJson)', () => {
      const state = createValidGCPState();
      state.gcp = {
        credentialMode: 'service_account',
        serviceAccountJson: '{"type":"service_account","project_id":"test"}',
        existingSecretName: '',
      };

      const yaml = generateValuesYaml(state);

      expect(yaml).not.toBeNull();
      expect(yaml).toContain('provider: "gcp"');
      expect(yaml).toContain('inject: true');
      expect(yaml).toContain('create: true');
      expect(yaml).toContain('serviceAccountJson:');
      expect(yaml).toContain('service_account');
    });
  });

  describe('Scaling Configuration', () => {
    test('generates processLogs/processMetrics/processTraces with autoscaling', () => {
      const state = createValidAWSState();
      state.scaling = { processLogsMax: '5', processMetricsMax: '8', processTracesMax: '3' };

      const yaml = generateValuesYaml(state);

      expect(yaml).not.toBeNull();
      expect(yaml).toContain('processLogs:');
      expect(yaml).toContain('processMetrics:');
      expect(yaml).toContain('processTraces:');
      expect(yaml).toContain('minReplicas: 1');
      expect(yaml).toContain('maxReplicas: 5');
      expect(yaml).toContain('maxReplicas: 8');
      expect(yaml).toContain('maxReplicas: 3');
    });

    test('does not generate old ingest* or keda keys', () => {
      const state = createValidAWSState();

      const yaml = generateValuesYaml(state);

      expect(yaml).not.toBeNull();
      expect(yaml).not.toContain('ingestLogs');
      expect(yaml).not.toContain('ingestMetrics');
      expect(yaml).not.toContain('ingestTraces');
      expect(yaml).not.toContain('mode: "keda"');
      expect(yaml).not.toContain('mode: "disabled"');
    });
  });

  describe('PubSub Configuration', () => {
    test('generates HTTP pubsub for AWS', () => {
      const state = createValidAWSState();
      state.pubsub.type = 'http';
      state.pubsub.httpReplicas = '3';

      const yaml = generateValuesYaml(state);

      expect(yaml).not.toBeNull();
      expect(yaml).toContain('pubsub:');
      expect(yaml).toContain('HTTP:');
      expect(yaml).toContain('enabled: true');
      expect(yaml).toContain('replicas: 3');
    });

    test('generates SQS pubsub for AWS', () => {
      const state = createValidAWSState();
      state.pubsub.type = 'sqs';
      state.pubsub.sqsQueueURL = 'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue';
      state.pubsub.sqsReplicas = '2';

      const yaml = generateValuesYaml(state);

      expect(yaml).not.toBeNull();
      expect(yaml).toContain('pubsub:');
      expect(yaml).toContain('SQS:');
      expect(yaml).toContain('enabled: true');
      expect(yaml).toContain('queueURL: "https://sqs.us-east-1.amazonaws.com/123456789012/my-queue"');
    });

    test('generates SQS with optional region and roleARN', () => {
      const state = createValidAWSState();
      state.pubsub.type = 'sqs';
      state.pubsub.sqsQueueURL = 'https://sqs.us-east-2.amazonaws.com/123456789012/q';
      state.pubsub.sqsRegion = 'us-east-2';
      state.pubsub.sqsRoleARN = 'arn:aws:iam::123456789012:role/my-role';

      const yaml = generateValuesYaml(state);

      expect(yaml).not.toBeNull();
      expect(yaml).toContain('region: "us-east-2"');
      expect(yaml).toContain('roleARN: "arn:aws:iam::123456789012:role/my-role"');
    });

    test('returns null when SQS selected but queueURL empty', () => {
      const state = createValidAWSState();
      state.pubsub.type = 'sqs';
      state.pubsub.sqsQueueURL = '';

      expect(generateValuesYaml(state)).toBeNull();
    });

    test('generates GCP Pub/Sub for GCP provider', () => {
      const state = createValidGCPState();

      const yaml = generateValuesYaml(state);

      expect(yaml).not.toBeNull();
      expect(yaml).toContain('pubsub:');
      expect(yaml).toContain('GCP:');
      expect(yaml).toContain('enabled: true');
      expect(yaml).toContain('projectID: "my-project-123"');
      expect(yaml).toContain('subscriptionID: "my-subscription"');
    });

    test('returns null when GCP missing projectID', () => {
      const state = createValidGCPState();
      state.pubsub.gcpProjectID = '';

      expect(generateValuesYaml(state)).toBeNull();
    });

    test('returns null when GCP missing subscriptionID', () => {
      const state = createValidGCPState();
      state.pubsub.gcpSubscriptionID = '';

      expect(generateValuesYaml(state)).toBeNull();
    });
  });

  describe('Grafana Configuration', () => {
    test('includes grafana apiKey when enabled', () => {
      const state = createValidAWSState();
      state.enableGrafana = true;

      const yaml = generateValuesYaml(state);

      expect(yaml).toContain('grafana:');
      expect(yaml).toContain('enabled: true');
      expect(yaml).toContain(`apiKey: "${state.apiKey}"`);
    });

    test('does not include apiKey when grafana disabled', () => {
      const state = createValidAWSState();
      state.enableGrafana = false;

      const yaml = generateValuesYaml(state);

      expect(yaml).toContain('grafana:');
      expect(yaml).toContain('enabled: false');
    });
  });

  describe('Database Configuration', () => {
    test('generates database with create mode', () => {
      const state = createValidAWSState();

      const yaml = generateValuesYaml(state);

      expect(yaml).not.toBeNull();
      expect(yaml).toContain('database:');
      expect(yaml).toContain('host: "lakerunner-db.example.com"');
      expect(yaml).toContain('password: "testpassword123"');
    });

    test('generates database with existing secret', () => {
      const state = createValidAWSState();
      state.lrdb.credentialMode = 'existing';
      state.lrdb.existingSecretName = 'lrdb-credentials';

      const yaml = generateValuesYaml(state);

      expect(yaml).not.toBeNull();
      expect(yaml).toContain('secretName: "lrdb-credentials"');
      expect(yaml).not.toContain('password: "testpassword123"');
    });

    test('generates configdb with create mode', () => {
      const state = createValidAWSState();

      const yaml = generateValuesYaml(state);

      expect(yaml).not.toBeNull();
      expect(yaml).toContain('configdb:');
      expect(yaml).toContain('host: "config-db.example.com"');
    });

    test('returns null when lrdb host empty', () => {
      const state = createValidAWSState();
      state.lrdb.host = '';

      expect(generateValuesYaml(state)).toBeNull();
    });

    test('returns null when configdb host empty', () => {
      const state = createValidAWSState();
      state.configdb.host = '';

      expect(generateValuesYaml(state)).toBeNull();
    });
  });

  describe('Validation', () => {
    test('returns null when collector name is invalid', () => {
      const state = createValidAWSState();
      state.collectorName = 'default';

      expect(generateValuesYaml(state)).toBeNull();
    });

    test('returns null when organization ID is invalid', () => {
      const state = createValidAWSState();
      state.organizationId = 'not-a-uuid';

      expect(generateValuesYaml(state)).toBeNull();
    });

    test('returns null when GCP service account mode has no JSON', () => {
      const state = createValidGCPState();
      state.gcp.credentialMode = 'service_account';
      state.gcp.serviceAccountJson = '';

      expect(generateValuesYaml(state)).toBeNull();
    });

    test('returns null when GCP existing secret mode has no secret name', () => {
      const state = createValidGCPState();
      state.gcp.credentialMode = 'existing';
      state.gcp.existingSecretName = '';

      expect(generateValuesYaml(state)).toBeNull();
    });

    test('passes validation for GCP workload identity with no credentials', () => {
      const state = createValidGCPState();
      state.gcp.credentialMode = 'workload_identity';

      expect(generateValuesYaml(state)).not.toBeNull();
    });
  });

  describe('Storage Profiles', () => {
    test('includes organization_id and collector_name in storageProfiles', () => {
      const state = createValidAWSState();

      const yaml = generateValuesYaml(state);

      expect(yaml).toContain('storageProfiles:');
      expect(yaml).toContain('organization_id: "b3a870ae-2c05-42b9-b073-572e718ad39d"');
      expect(yaml).toContain('collector_name: "test-collector"');
      expect(yaml).toContain('cloud_provider: "aws"');
      expect(yaml).toContain('bucket: "test-bucket"');
    });
  });

  describe('Collector Configuration', () => {
    test('collector is always disabled in generated YAML', () => {
      const state = createValidAWSState();

      const yaml = generateValuesYaml(state);

      expect(yaml).toContain('collector:');
      expect(yaml).toContain('enabled: false');
    });
  });

  describe('No removed fields in output', () => {
    test('does not contain kafka, keda, or cardinal monitoring fields', () => {
      const state = createValidAWSState();

      const yaml = generateValuesYaml(state);

      expect(yaml).not.toBeNull();
      expect(yaml).not.toContain('kafka:');
      expect(yaml).not.toContain('brokers:');
      expect(yaml).not.toContain('sasl:');
      expect(yaml).not.toContain('global:');
      expect(yaml).not.toContain('OTEL_EXPORTER');
    });
  });
});
