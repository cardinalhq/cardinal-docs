// Types for the Install Wizard state
export type InstallType = 'poc' | 'production';
export type CloudProvider = 'aws' | 'gcp' | 'azure';
export type AWSCredentialMode = 'create' | 'existing' | 'eks';
export type GCPCredentialMode = 'workload_identity' | 'service_account' | 'existing';
export type SecretMode = 'create' | 'existing';
export type PubSubType = 'http' | 'sqs';
export type GCPPubSubType = 'gcp';
export type LicenseMode = 'create' | 'existing';

export interface StorageConfig {
  bucket: string;
  region: string;
  endpoint?: string;
}

export interface AWSConfig {
  credentialMode: AWSCredentialMode;
  accessKeyId: string;
  secretAccessKey: string;
  existingSecretName: string;
}

export interface GCPConfig {
  credentialMode: GCPCredentialMode;
  serviceAccountJson: string;
  existingSecretName: string;
}

export interface AzureConfig {
  storageAccountName: string;
  storageAccountKey: string;
  containerName: string;
}

export interface PostgresConfig {
  credentialMode: SecretMode;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  sslMode: string;
  existingSecretName: string;
}

export interface ScalingConfig {
  processLogsMax: string;
  processMetricsMax: string;
  processTracesMax: string;
}

export interface PubSubConfig {
  type: PubSubType;
  httpReplicas: string;
  sqsReplicas: string;
  sqsQueueURL: string;
  sqsRegion: string;
  sqsRoleARN: string;
  gcpReplicas: string;
  gcpProjectID: string;
  gcpSubscriptionID: string;
}

export interface LicenseConfig {
  mode: LicenseMode;
  secretName: string;
  data: string;
}

export interface WizardState {
  installType: InstallType;
  cloudProvider: CloudProvider;
  organizationId: string;
  collectorName: string;
  apiKey: string;
  storage: StorageConfig;
  aws: AWSConfig;
  gcp: GCPConfig;
  azure: AzureConfig;
  lrdb: PostgresConfig;
  configdb: PostgresConfig;
  scaling: ScalingConfig;
  pubsub: PubSubConfig;
  license: LicenseConfig;
  enableGrafana: boolean;
  enableCollector: boolean;
}

// Validation functions
export function isValidCollectorName(name: string): boolean {
  const trimmed = name.trim().toLowerCase();
  return trimmed !== '' && trimmed !== 'default';
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid.trim());
}

export function isValidPort(port: string): boolean {
  const portNum = parseInt(port, 10);
  return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
}

export function isValidLicenseData(data: string): boolean {
  const trimmed = data.trim();
  return trimmed.startsWith('b64:') || trimmed.startsWith('z64:');
}

export function isBasicsConfigured(state: WizardState): boolean {
  if (!isValidCollectorName(state.collectorName)) return false;
  if (!isValidUUID(state.organizationId)) return false;
  if (!state.apiKey.trim()) return false;

  // Validate license
  if (state.license.mode === 'create' && !isValidLicenseData(state.license.data)) return false;
  if (state.license.mode === 'existing' && !state.license.secretName.trim()) return false;

  // Validate storage configuration
  if (!state.storage.bucket.trim()) return false;
  if (!state.storage.region.trim()) return false;

  // Validate cloud provider credentials
  if (state.cloudProvider === 'aws') {
    if (state.aws.credentialMode === 'create') {
      if (!state.aws.accessKeyId.trim()) return false;
      if (!state.aws.secretAccessKey.trim()) return false;
    } else if (state.aws.credentialMode === 'existing') {
      if (!state.aws.existingSecretName.trim()) return false;
    }
  } else if (state.cloudProvider === 'gcp') {
    if (state.gcp.credentialMode === 'service_account') {
      if (!state.gcp.serviceAccountJson.trim()) return false;
    } else if (state.gcp.credentialMode === 'existing') {
      if (!state.gcp.existingSecretName.trim()) return false;
    }
  }

  // Validate database configuration
  if (!state.lrdb.host.trim()) return false;
  if (!isValidPort(state.lrdb.port)) return false;
  if (!state.lrdb.database.trim()) return false;
  if (!state.lrdb.username.trim()) return false;
  if (state.lrdb.credentialMode === 'create' && !state.lrdb.password.trim()) return false;
  if (state.lrdb.credentialMode === 'existing' && !state.lrdb.existingSecretName.trim()) return false;

  if (!state.configdb.host.trim()) return false;
  if (!isValidPort(state.configdb.port)) return false;
  if (!state.configdb.database.trim()) return false;
  if (!state.configdb.username.trim()) return false;
  if (state.configdb.credentialMode === 'create' && !state.configdb.password.trim()) return false;
  if (state.configdb.credentialMode === 'existing' && !state.configdb.existingSecretName.trim()) return false;

  // Validate pubsub (required)
  if (state.cloudProvider === 'gcp') {
    if (!state.pubsub.gcpProjectID.trim()) return false;
    if (!state.pubsub.gcpSubscriptionID.trim()) return false;
  } else {
    if (state.pubsub.type === 'sqs' && !state.pubsub.sqsQueueURL.trim()) return false;
  }

  return true;
}

// Default state factory
export function createDefaultState(): WizardState {
  return {
    installType: 'poc',
    cloudProvider: 'aws',
    organizationId: '',
    collectorName: '',
    apiKey: '',
    storage: { bucket: '', region: 'us-east-1', endpoint: '' },
    aws: { credentialMode: 'eks', accessKeyId: '', secretAccessKey: '', existingSecretName: '' },
    gcp: { credentialMode: 'workload_identity', serviceAccountJson: '', existingSecretName: '' },
    azure: { storageAccountName: '', storageAccountKey: '', containerName: '' },
    lrdb: { credentialMode: 'create', host: '', port: '5432', database: 'lakerunner', username: '', password: '', sslMode: 'require', existingSecretName: '' },
    configdb: { credentialMode: 'create', host: '', port: '5432', database: 'configdb', username: '', password: '', sslMode: 'require', existingSecretName: '' },
    scaling: { processLogsMax: '10', processMetricsMax: '10', processTracesMax: '10' },
    pubsub: { type: 'http', httpReplicas: '2', sqsReplicas: '2', sqsQueueURL: '', sqsRegion: '', sqsRoleARN: '', gcpReplicas: '1', gcpProjectID: '', gcpSubscriptionID: '' },
    license: { mode: 'create', secretName: 'lakerunner-license', data: '' },
    enableGrafana: true,
    enableCollector: true,
  };
}

// YAML generator
export function generateValuesYaml(state: WizardState): string | null {
  if (!isBasicsConfigured(state)) {
    return null;
  }

  const lines: string[] = ['# Lakerunner Values Configuration', '# Generated by Cardinal Install Wizard', ''];

  // License
  lines.push('license:');
  if (state.license.mode === 'existing') {
    lines.push('  create: false');
    lines.push(`  secretName: "${state.license.secretName}"`);
  } else {
    lines.push('  create: true');
    lines.push(`  secretName: "${state.license.secretName}"`);
    lines.push(`  data: "${state.license.data.trim()}"`);
  }
  lines.push('');


  // API Keys
  lines.push('apiKeys:');
  lines.push('  source: config');
  lines.push('  secretName: "apikeys"');
  lines.push('  create: true');
  lines.push('  yaml:');
  lines.push(`    - organization_id: "${state.organizationId}"`);
  lines.push('      keys:');
  lines.push(`        - "${state.apiKey}"`);
  lines.push('');

  // Cloud provider credentials
  lines.push('cloudProvider:');
  lines.push(`  provider: "${state.cloudProvider}"`);
  if (state.cloudProvider === 'aws') {
    lines.push('  aws:');
    lines.push(`    region: "${state.storage.region}"`);
    if (state.aws.credentialMode === 'eks') {
      lines.push('    inject: false');
      lines.push('    create: false');
    } else if (state.aws.credentialMode === 'existing') {
      lines.push('    inject: true');
      lines.push('    create: false');
      lines.push(`    secretName: "${state.aws.existingSecretName}"`);
    } else {
      lines.push('    inject: true');
      lines.push('    create: true');
      lines.push(`    accessKeyId: "${state.aws.accessKeyId}"`);
      lines.push(`    secretAccessKey: "${state.aws.secretAccessKey}"`);
    }
  } else if (state.cloudProvider === 'gcp') {
    lines.push('  gcp:');
    if (state.gcp.credentialMode === 'workload_identity') {
      lines.push('    inject: false');
      lines.push('    create: false');
    } else if (state.gcp.credentialMode === 'existing') {
      lines.push('    inject: true');
      lines.push('    create: false');
      lines.push(`    secretName: "${state.gcp.existingSecretName}"`);
    } else {
      lines.push('    inject: true');
      lines.push('    create: true');
      lines.push(`    serviceAccountJson: '${state.gcp.serviceAccountJson}'`);
    }
  } else if (state.cloudProvider === 'azure') {
    lines.push('  azure:');
    lines.push(`    storageAccountName: "${state.azure.storageAccountName}"`);
    lines.push(`    storageAccountKey: "${state.azure.storageAccountKey}"`);
  }
  lines.push('');

  // Storage profiles
  lines.push('storageProfiles:');
  lines.push('  source: config');
  lines.push('  create: true');
  lines.push('  yaml:');
  lines.push(`    - organization_id: "${state.organizationId}"`);
  lines.push(`      collector_name: "${state.collectorName}"`);
  lines.push(`      cloud_provider: "${state.cloudProvider}"`);
  lines.push(`      region: "${state.storage.region}"`);
  if (state.cloudProvider === 'azure') {
    lines.push(`      bucket: "${state.azure.containerName}"`);
  } else {
    lines.push(`      bucket: "${state.storage.bucket}"`);
  }
  if (state.storage.endpoint) {
    lines.push(`      endpoint: "${state.storage.endpoint}"`);
  }
  lines.push('');

  // Database configuration
  lines.push('database:');
  if (state.lrdb.credentialMode === 'existing') {
    lines.push('  create: false');
    lines.push(`  secretName: "${state.lrdb.existingSecretName}"`);
  } else {
    lines.push('  create: true');
  }
  lines.push('  lrdb:');
  lines.push(`    host: "${state.lrdb.host}"`);
  lines.push(`    port: ${state.lrdb.port}`);
  lines.push(`    name: "${state.lrdb.database}"`);
  lines.push(`    username: "${state.lrdb.username}"`);
  if (state.lrdb.credentialMode === 'create') {
    lines.push(`    password: "${state.lrdb.password}"`);
  }
  lines.push(`    sslMode: "${state.lrdb.sslMode}"`);
  lines.push('');

  lines.push('configdb:');
  if (state.configdb.credentialMode === 'existing') {
    lines.push('  create: false');
    lines.push(`  secretName: "${state.configdb.existingSecretName}"`);
  } else {
    lines.push('  create: true');
  }
  lines.push('  lrdb:');
  lines.push(`    host: "${state.configdb.host}"`);
  lines.push(`    port: ${state.configdb.port}`);
  lines.push(`    name: "${state.configdb.database}"`);
  lines.push(`    username: "${state.configdb.username}"`);
  if (state.configdb.credentialMode === 'create') {
    lines.push(`    password: "${state.configdb.password}"`);
  }
  lines.push(`    sslMode: "${state.configdb.sslMode}"`);
  lines.push('');

  // Process service scaling
  lines.push('processLogs:');
  lines.push('  autoscaling:');
  lines.push(`    minReplicas: 1`);
  lines.push(`    maxReplicas: ${state.scaling.processLogsMax}`);
  lines.push('');
  lines.push('processMetrics:');
  lines.push('  autoscaling:');
  lines.push(`    minReplicas: 1`);
  lines.push(`    maxReplicas: ${state.scaling.processMetricsMax}`);
  lines.push('');
  lines.push('processTraces:');
  lines.push('  autoscaling:');
  lines.push(`    minReplicas: 1`);
  lines.push(`    maxReplicas: ${state.scaling.processTracesMax}`);
  lines.push('');

  // PubSub (ingestion)
  lines.push('pubsub:');
  if (state.cloudProvider === 'gcp') {
    lines.push('  GCP:');
    lines.push('    enabled: true');
    lines.push(`    replicas: ${state.pubsub.gcpReplicas}`);
    lines.push(`    projectID: "${state.pubsub.gcpProjectID}"`);
    lines.push(`    subscriptionID: "${state.pubsub.gcpSubscriptionID}"`);
  } else if (state.pubsub.type === 'http') {
    lines.push('  HTTP:');
    lines.push('    enabled: true');
    lines.push(`    replicas: ${state.pubsub.httpReplicas}`);
  } else if (state.pubsub.type === 'sqs') {
    lines.push('  SQS:');
    lines.push('    enabled: true');
    lines.push(`    replicas: ${state.pubsub.sqsReplicas}`);
    lines.push(`    queueURL: "${state.pubsub.sqsQueueURL}"`);
    if (state.pubsub.sqsRegion.trim()) {
      lines.push(`    region: "${state.pubsub.sqsRegion}"`);
    }
    if (state.pubsub.sqsRoleARN.trim()) {
      lines.push(`    roleARN: "${state.pubsub.sqsRoleARN}"`);
    }
  }
  lines.push('');

  // Grafana settings
  lines.push('grafana:');
  lines.push(`  enabled: ${state.enableGrafana}`);
  if (state.enableGrafana) {
    lines.push('  cardinal:');
    lines.push(`    apiKey: "${state.apiKey}"`);
  }
  lines.push('');

  // Collector settings (disabled - use external collector)
  lines.push('collector:');
  lines.push('  enabled: false');
  lines.push('');

  return lines.join('\n');
}
