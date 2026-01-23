'use client';

import { useState, useCallback } from 'react';
import styles from './InstallWizard.module.css';

type InstallType = 'kind' | 'poc' | 'production';
type CloudProvider = 'aws' | 'gcp' | 'azure';
type AWSCredentialMode = 'create' | 'existing' | 'eks';
type SecretMode = 'create' | 'existing';

interface StorageConfig {
  bucket: string;
  region: string;
  endpoint?: string;
}

interface AWSConfig {
  credentialMode: AWSCredentialMode;
  accessKeyId: string;
  secretAccessKey: string;
  existingSecretName: string;
}

interface GCPConfig {
  serviceAccountJson: string;
  hmacAccessKey: string;
  hmacSecretKey: string;
}

interface AzureConfig {
  storageAccountName: string;
  storageAccountKey: string;
  containerName: string;
}

interface PostgresConfig {
  credentialMode: SecretMode;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  sslMode: string;
  existingSecretName: string;
}

interface KafkaConfig {
  credentialMode: SecretMode;
  brokers: string;
  saslMechanism: string;
  username: string;
  password: string;
  useTls: boolean;
  existingSecretName: string;
}

interface WizardState {
  installType: InstallType;
  cloudProvider: CloudProvider;
  organizationId: string;
  collectorName: string;
  apiKey: string;
  grafanaApiKey: string;
  storage: StorageConfig;
  aws: AWSConfig;
  gcp: GCPConfig;
  azure: AzureConfig;
  lrdb: PostgresConfig;
  configdb: PostgresConfig;
  kafka: KafkaConfig;
  enableKeda: boolean;
  enableGrafana: boolean;
  enableCollector: boolean;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'chq_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function isValidCollectorName(name: string): boolean {
  const trimmed = name.trim().toLowerCase();
  return trimmed !== '' && trimmed !== 'default';
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid.trim());
}

function isValidPort(port: string): boolean {
  const portNum = parseInt(port, 10);
  return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
}

function isBasicsConfigured(state: WizardState): boolean {
  if (!isValidCollectorName(state.collectorName)) return false;
  if (!isValidUUID(state.organizationId)) return false;
  if (state.enableGrafana && !state.grafanaApiKey.trim()) return false;

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
  }

  // For POC and Production, validate database and Kafka configuration
  if (state.installType === 'poc' || state.installType === 'production') {
    // Validate lrdb
    if (!state.lrdb.host.trim()) return false;
    if (!isValidPort(state.lrdb.port)) return false;
    if (!state.lrdb.database.trim()) return false;
    if (!state.lrdb.username.trim()) return false;
    if (state.lrdb.credentialMode === 'create' && !state.lrdb.password.trim()) return false;
    if (state.lrdb.credentialMode === 'existing' && !state.lrdb.existingSecretName.trim()) return false;

    // Validate configdb
    if (!state.configdb.host.trim()) return false;
    if (!isValidPort(state.configdb.port)) return false;
    if (!state.configdb.database.trim()) return false;
    if (!state.configdb.username.trim()) return false;
    if (state.configdb.credentialMode === 'create' && !state.configdb.password.trim()) return false;
    if (state.configdb.credentialMode === 'existing' && !state.configdb.existingSecretName.trim()) return false;

    // Validate kafka
    if (!state.kafka.brokers.trim()) return false;
    if (state.kafka.credentialMode === 'create' && !state.kafka.username.trim()) return false;
    if (state.kafka.credentialMode === 'create' && !state.kafka.password.trim()) return false;
    if (state.kafka.credentialMode === 'existing' && !state.kafka.existingSecretName.trim()) return false;
  }

  return true;
}

const defaultState: WizardState = {
  installType: 'kind',
  cloudProvider: 'aws',
  organizationId: '',
  collectorName: '',
  apiKey: '',
  grafanaApiKey: '',
  storage: { bucket: '', region: 'us-east-1', endpoint: '' },
  aws: { credentialMode: 'create', accessKeyId: '', secretAccessKey: '', existingSecretName: '' },
  gcp: { serviceAccountJson: '', hmacAccessKey: '', hmacSecretKey: '' },
  azure: { storageAccountName: '', storageAccountKey: '', containerName: '' },
  lrdb: { credentialMode: 'create', host: '', port: '5432', database: 'lakerunner', username: '', password: '', sslMode: 'require', existingSecretName: '' },
  configdb: { credentialMode: 'create', host: '', port: '5432', database: 'configdb', username: '', password: '', sslMode: 'require', existingSecretName: '' },
  kafka: { credentialMode: 'create', brokers: '', saslMechanism: 'PLAIN', username: '', password: '', useTls: true, existingSecretName: '' },
  enableKeda: true,
  enableGrafana: true,  // Will be adjusted based on install type
  enableCollector: true, // Will be adjusted based on install type
};

function generateValuesYaml(state: WizardState): string | null {
  if (state.installType === 'kind') {
    return `# LakeRunner Kind/Local Install
# Run with: ./lakerunner-standalone-poc.sh --standalone
# No custom values.yaml needed for local development`;
  }

  // Check if basics are configured
  if (!isBasicsConfigured(state)) {
    return null;
  }

  const lines: string[] = ['# LakeRunner Values Configuration', '# Generated by Cardinal Install Wizard', ''];

  // Global settings
  lines.push('global:');
  lines.push('  autoscaling:');
  lines.push(`    mode: "${state.enableKeda ? 'keda' : 'disabled'}"`);
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
  if (state.enableGrafana && state.grafanaApiKey) {
    lines.push(`        - "${state.grafanaApiKey}"`);
  }
  lines.push('');

  // Cloud provider credentials
  lines.push('cloudProvider:');
  lines.push(`  provider: "${state.cloudProvider}"`);
  if (state.cloudProvider === 'aws') {
    lines.push('  aws:');
    lines.push(`    region: "${state.storage.region}"`);
    if (state.aws.credentialMode === 'eks') {
      // Use EKS-provided credentials (IRSA/Pod Identity)
      lines.push('    inject: false');
      lines.push('    create: false');
    } else if (state.aws.credentialMode === 'existing') {
      // Use existing secret
      lines.push('    inject: true');
      lines.push('    create: false');
      lines.push(`    secretName: "${state.aws.existingSecretName}"`);
    } else {
      // Create new secret
      lines.push('    inject: true');
      lines.push('    create: true');
      lines.push(`    accessKeyId: "${state.aws.accessKeyId}"`);
      lines.push(`    secretAccessKey: "${state.aws.secretAccessKey}"`);
    }
  } else if (state.cloudProvider === 'gcp') {
    lines.push('  gcp:');
    lines.push(`    serviceAccountJson: |`);
    state.gcp.serviceAccountJson.split('\n').forEach(line => {
      lines.push(`      ${line}`);
    });
    lines.push(`    hmacAccessKey: "${state.gcp.hmacAccessKey}"`);
    lines.push(`    hmacSecretKey: "${state.gcp.hmacSecretKey}"`);
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

  // Database configuration (POC and Production)
  if (state.installType === 'poc' || state.installType === 'production') {
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

    lines.push('kafka:');
    if (state.kafka.credentialMode === 'existing') {
      lines.push('  create: false');
      lines.push(`  secretName: "${state.kafka.existingSecretName}"`);
    } else {
      lines.push('  create: true');
    }
    lines.push(`  brokers: "${state.kafka.brokers}"`);
    lines.push('  sasl:');
    lines.push('    enabled: true');
    lines.push(`    mechanism: "${state.kafka.saslMechanism}"`);
    if (state.kafka.credentialMode === 'create') {
      lines.push(`    username: "${state.kafka.username}"`);
      lines.push(`    password: "${state.kafka.password}"`);
    }
    lines.push('  tls:');
    lines.push(`    enabled: ${state.kafka.useTls}`);
    lines.push('');
  }

  // Production-specific settings
  if (state.installType === 'production') {
    lines.push('# Production replica settings');
    lines.push('ingestLogs:');
    lines.push('  replicas: 3');
    lines.push('ingestMetrics:');
    lines.push('  replicas: 3');
    lines.push('ingestTraces:');
    lines.push('  replicas: 3');
    lines.push('');
    lines.push('queryApi:');
    lines.push('  replicas: 2');
    lines.push('');
  }

  // Grafana settings
  lines.push('grafana:');
  lines.push(`  enabled: ${state.enableGrafana}`);
  if (state.enableGrafana && state.grafanaApiKey) {
    lines.push('  cardinal:');
    lines.push(`    apiKey: "${state.grafanaApiKey}"`);
  }
  lines.push('');

  // Collector settings
  lines.push('collector:');
  lines.push(`  enabled: ${state.enableCollector}`);
  lines.push('');

  return lines.join('\n');
}

export default function InstallWizard() {
  const [state, setState] = useState<WizardState>(defaultState);
  const [copied, setCopied] = useState(false);

  const updateState = useCallback(<K extends keyof WizardState>(
    key: K,
    value: WizardState[K]
  ) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateNested = useCallback(<K extends keyof WizardState>(
    key: K,
    field: string,
    value: string | boolean
  ) => {
    setState(prev => ({
      ...prev,
      [key]: { ...(prev[key] as object), [field]: value }
    }));
  }, []);

  const handleGenerateOrgId = () => {
    updateState('organizationId', generateUUID());
  };

  const handleGenerateApiKey = () => {
    updateState('apiKey', generateApiKey());
  };

  const handleGenerateGrafanaApiKey = () => {
    updateState('grafanaApiKey', generateApiKey());
  };

  const handleInstallTypeChange = (installType: InstallType) => {
    setState(prev => ({
      ...prev,
      installType,
      // POC: Grafana and Collector enabled by default
      // Production: Both disabled by default
      enableGrafana: installType === 'poc',
      enableCollector: installType === 'poc',
    }));
  };

  const handleCopy = async () => {
    const yaml = generateValuesYaml(state);
    if (yaml) {
      await navigator.clipboard.writeText(yaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const yaml = generateValuesYaml(state);

  return (
    <div className={styles.wizard}>
      <div className={styles.privacyNote}>
        🔒 <strong>Privacy First:</strong> This wizard runs entirely in your browser. No data is sent to any server.
      </div>

      {/* Installation Type Selection */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Installation Type</h3>
        <div className={styles.installTypes}>
          <button
            className={`${styles.typeCard} ${state.installType === 'kind' ? styles.active : ''}`}
            onClick={() => handleInstallTypeChange('kind')}
          >
            <strong>Kind / Local</strong>
            <span>Single machine development setup using Kind or Minikube</span>
          </button>
          <button
            className={`${styles.typeCard} ${state.installType === 'poc' ? styles.active : ''}`}
            onClick={() => handleInstallTypeChange('poc')}
          >
            <strong>Kubernetes POC</strong>
            <span>Proof of concept with real cloud storage and databases</span>
          </button>
          <button
            className={`${styles.typeCard} ${state.installType === 'production' ? styles.active : ''}`}
            onClick={() => handleInstallTypeChange('production')}
          >
            <strong>Production</strong>
            <span>Full production deployment with HA and autoscaling</span>
          </button>
        </div>
      </section>

      {state.installType === 'kind' ? (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Local Development Setup</h3>
          <p className={styles.description}>
            For local development, no custom configuration is needed. Simply run the install script:
          </p>
          <pre className={styles.codeBlock}>
{`curl -sSL -o lakerunner-standalone-poc.sh \\
  https://raw.githubusercontent.com/cardinalhq/charts/refs/heads/main/install-scripts/lakerunner-standalone-poc.sh
chmod +x lakerunner-standalone-poc.sh
./lakerunner-standalone-poc.sh --standalone`}
          </pre>
        </section>
      ) : (
        <>
          {/* Organization & API Keys */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Organization & API Keys</h3>
            <div className={styles.formGridTwoCol}>
              <div className={styles.formGroup}>
                <label>Organization ID <span className={styles.required}>*</span></label>
                <div className={styles.inputWithButton}>
                  <input
                    type="text"
                    value={state.organizationId}
                    onChange={(e) => updateState('organizationId', e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className={state.organizationId && !isValidUUID(state.organizationId) ? styles.inputError : ''}
                  />
                  <button onClick={handleGenerateOrgId} className={styles.generateBtn}>
                    Generate
                  </button>
                </div>
                {state.organizationId && !isValidUUID(state.organizationId) && (
                  <span className={styles.errorText}>
                    Must be a valid UUID format
                  </span>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>Collector Name <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  value={state.collectorName}
                  onChange={(e) => updateState('collectorName', e.target.value)}
                  placeholder="my-collector"
                  className={!isValidCollectorName(state.collectorName) ? styles.inputError : ''}
                />
                {!isValidCollectorName(state.collectorName) && (
                  <span className={styles.errorText}>
                    Collector name is required and cannot be "default"
                  </span>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>API Key</label>
                <div className={styles.inputWithButton}>
                  <input
                    type="text"
                    value={state.apiKey}
                    onChange={(e) => updateState('apiKey', e.target.value)}
                    placeholder="chq_..."
                  />
                  <button onClick={handleGenerateApiKey} className={styles.generateBtn}>
                    Generate
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Optional Components */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Optional Components</h3>

            {/* Grafana Component */}
            <div className={styles.optionalComponent}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={state.enableGrafana}
                  onChange={(e) => updateState('enableGrafana', e.target.checked)}
                />
                <strong>Grafana</strong>
              </label>
              <span className={styles.hint}>Pre-configured Grafana with LakeRunner datasources</span>
              {state.enableGrafana && (
                <div className={styles.componentSettings}>
                  <div className={styles.formGroup}>
                    <label>Grafana API Key <span className={styles.required}>*</span></label>
                    <div className={styles.inputWithButton}>
                      <input
                        type="text"
                        value={state.grafanaApiKey}
                        onChange={(e) => updateState('grafanaApiKey', e.target.value)}
                        placeholder="chq_..."
                        className={!state.grafanaApiKey.trim() ? styles.inputError : ''}
                      />
                      <button onClick={handleGenerateGrafanaApiKey} className={styles.generateBtn}>
                        Generate
                      </button>
                    </div>
                    <span className={styles.hint}>Dedicated API key for Grafana to query LakeRunner</span>
                  </div>
                </div>
              )}
            </div>

            {/* Collector Component */}
            <div className={styles.optionalComponent}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={state.enableCollector}
                  onChange={(e) => updateState('enableCollector', e.target.checked)}
                />
                <strong>OpenTelemetry Collector</strong>
              </label>
              <span className={styles.hint}>Deploys an OTel Collector for ingesting telemetry data</span>
            </div>

            {/* KEDA Component */}
            <div className={styles.optionalComponent}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={state.enableKeda}
                  onChange={(e) => updateState('enableKeda', e.target.checked)}
                />
                <strong>KEDA Autoscaling</strong>
              </label>
              <span className={styles.hint}>Work queue-based autoscaling for production workloads</span>
              {!state.enableKeda && (state.installType === 'poc' || state.installType === 'production') && (
                <div className={styles.componentSettings}>
                  <div className={styles.warningBox}>
                    <strong>⚠️ Warning:</strong> KEDA is highly recommended for {state.installType === 'poc' ? 'POC' : 'production'} deployments.
                    It provides intelligent scaling based on workload backlog, which is essential for micro-batch workloads.
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Cloud Provider */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Cloud Provider</h3>
            <div className={styles.providerSelect}>
              <button
                className={`${styles.providerBtn} ${state.cloudProvider === 'aws' ? styles.active : ''}`}
                onClick={() => updateState('cloudProvider', 'aws')}
              >
                AWS
              </button>
              <button
                className={`${styles.providerBtn} ${styles.disabled}`}
                disabled
              >
                GCP
                <span className={styles.comingSoon}>Coming Soon</span>
              </button>
              <button
                className={`${styles.providerBtn} ${styles.disabled}`}
                disabled
              >
                Azure
                <span className={styles.comingSoon}>Coming Soon</span>
              </button>
            </div>

            <div className={styles.formGrid}>
              {state.cloudProvider === 'aws' && (
                <>
                  <div className={styles.formGroup}>
                    <label>S3 Bucket Name <span className={styles.required}>*</span></label>
                    <input
                      type="text"
                      value={state.storage.bucket}
                      onChange={(e) => updateNested('storage', 'bucket', e.target.value)}
                      placeholder="my-lakerunner-bucket"
                      className={!state.storage.bucket.trim() ? styles.inputError : ''}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Region <span className={styles.required}>*</span></label>
                    <input
                      type="text"
                      value={state.storage.region}
                      onChange={(e) => updateNested('storage', 'region', e.target.value)}
                      placeholder="us-east-1"
                      className={!state.storage.region.trim() ? styles.inputError : ''}
                    />
                  </div>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Credentials</label>
                    <div className={styles.credentialModeSelect}>
                      <button
                        className={`${styles.credentialModeBtn} ${state.aws.credentialMode === 'create' ? styles.active : ''}`}
                        onClick={() => updateNested('aws', 'credentialMode', 'create')}
                      >
                        Create Secret
                      </button>
                      <button
                        className={`${styles.credentialModeBtn} ${state.aws.credentialMode === 'existing' ? styles.active : ''}`}
                        onClick={() => updateNested('aws', 'credentialMode', 'existing')}
                      >
                        Use Existing Secret
                      </button>
                      <button
                        className={`${styles.credentialModeBtn} ${state.aws.credentialMode === 'eks' ? styles.active : ''}`}
                        onClick={() => updateNested('aws', 'credentialMode', 'eks')}
                      >
                        EKS (IRSA/Pod Identity)
                      </button>
                    </div>
                  </div>
                  {state.aws.credentialMode === 'create' && (
                    <>
                      <div className={styles.formGroup}>
                        <label>Access Key ID <span className={styles.required}>*</span></label>
                        <input
                          type="text"
                          value={state.aws.accessKeyId}
                          onChange={(e) => updateNested('aws', 'accessKeyId', e.target.value)}
                          placeholder="AKIA..."
                          className={!state.aws.accessKeyId.trim() ? styles.inputError : ''}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Secret Access Key <span className={styles.required}>*</span></label>
                        <input
                          type="password"
                          value={state.aws.secretAccessKey}
                          onChange={(e) => updateNested('aws', 'secretAccessKey', e.target.value)}
                          placeholder="••••••••"
                          className={!state.aws.secretAccessKey.trim() ? styles.inputError : ''}
                        />
                      </div>
                    </>
                  )}
                  {state.aws.credentialMode === 'existing' && (
                    <div className={styles.formGroup}>
                      <label>Secret Name <span className={styles.required}>*</span></label>
                      <input
                        type="text"
                        value={state.aws.existingSecretName}
                        onChange={(e) => updateNested('aws', 'existingSecretName', e.target.value)}
                        placeholder="aws-credentials"
                        className={!state.aws.existingSecretName.trim() ? styles.inputError : ''}
                      />
                      <span className={styles.hint}>Name of existing Kubernetes secret containing AWS credentials</span>
                    </div>
                  )}
                  {state.aws.credentialMode === 'eks' && (
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <span className={styles.hint}>
                        Credentials will be provided by EKS via IAM Roles for Service Accounts (IRSA) or EKS Pod Identity.
                        Ensure your cluster and service account are configured appropriately.
                      </span>
                    </div>
                  )}
                </>
              )}

              {state.cloudProvider === 'gcp' && (
                <>
                  <div className={styles.formGroup}>
                    <label>GCS Bucket Name</label>
                    <input
                      type="text"
                      value={state.storage.bucket}
                      onChange={(e) => updateNested('storage', 'bucket', e.target.value)}
                      placeholder="my-lakerunner-bucket"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Region</label>
                    <input
                      type="text"
                      value={state.storage.region}
                      onChange={(e) => updateNested('storage', 'region', e.target.value)}
                      placeholder="us-central1"
                    />
                  </div>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Service Account JSON</label>
                    <textarea
                      value={state.gcp.serviceAccountJson}
                      onChange={(e) => updateNested('gcp', 'serviceAccountJson', e.target.value)}
                      placeholder='{"type": "service_account", ...}'
                      rows={4}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>HMAC Access Key</label>
                    <input
                      type="text"
                      value={state.gcp.hmacAccessKey}
                      onChange={(e) => updateNested('gcp', 'hmacAccessKey', e.target.value)}
                      placeholder="GOOG..."
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>HMAC Secret Key</label>
                    <input
                      type="password"
                      value={state.gcp.hmacSecretKey}
                      onChange={(e) => updateNested('gcp', 'hmacSecretKey', e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </>
              )}

              {state.cloudProvider === 'azure' && (
                <>
                  <div className={styles.formGroup}>
                    <label>Storage Account Name</label>
                    <input
                      type="text"
                      value={state.azure.storageAccountName}
                      onChange={(e) => updateNested('azure', 'storageAccountName', e.target.value)}
                      placeholder="mystorageaccount"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Container Name</label>
                    <input
                      type="text"
                      value={state.azure.containerName}
                      onChange={(e) => updateNested('azure', 'containerName', e.target.value)}
                      placeholder="lakerunner-data"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Region</label>
                    <input
                      type="text"
                      value={state.storage.region}
                      onChange={(e) => updateNested('storage', 'region', e.target.value)}
                      placeholder="eastus"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Storage Account Key</label>
                    <input
                      type="password"
                      value={state.azure.storageAccountKey}
                      onChange={(e) => updateNested('azure', 'storageAccountKey', e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* PostgreSQL Configuration */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>PostgreSQL - LakeRunner DB</h3>
            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Credentials</label>
                <div className={styles.credentialModeSelect}>
                  <button
                    className={`${styles.credentialModeBtn} ${state.lrdb.credentialMode === 'create' ? styles.active : ''}`}
                    onClick={() => updateNested('lrdb', 'credentialMode', 'create')}
                  >
                    Create Secret
                  </button>
                  <button
                    className={`${styles.credentialModeBtn} ${state.lrdb.credentialMode === 'existing' ? styles.active : ''}`}
                    onClick={() => updateNested('lrdb', 'credentialMode', 'existing')}
                  >
                    Use Existing Secret
                  </button>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Host <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  value={state.lrdb.host}
                  onChange={(e) => updateNested('lrdb', 'host', e.target.value)}
                  placeholder="lakerunner-db.example.com"
                  className={!state.lrdb.host.trim() ? styles.inputError : ''}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Port <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  value={state.lrdb.port}
                  onChange={(e) => updateNested('lrdb', 'port', e.target.value)}
                  placeholder="5432"
                  className={!isValidPort(state.lrdb.port) ? styles.inputError : ''}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Database <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  value={state.lrdb.database}
                  onChange={(e) => updateNested('lrdb', 'database', e.target.value)}
                  placeholder="lakerunner"
                  className={!state.lrdb.database.trim() ? styles.inputError : ''}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Username <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  value={state.lrdb.username}
                  onChange={(e) => updateNested('lrdb', 'username', e.target.value)}
                  placeholder="lakerunner"
                  className={!state.lrdb.username.trim() ? styles.inputError : ''}
                />
                <span className={styles.hint}>lakerunner</span>
              </div>
              {state.lrdb.credentialMode === 'create' ? (
                <div className={styles.formGroup}>
                  <label>Password <span className={styles.required}>*</span></label>
                  <input
                    type="password"
                    value={state.lrdb.password}
                    onChange={(e) => updateNested('lrdb', 'password', e.target.value)}
                    placeholder="••••••••"
                    className={!state.lrdb.password.trim() ? styles.inputError : ''}
                  />
                </div>
              ) : (
                <div className={styles.formGroup}>
                  <label>Secret Name <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    value={state.lrdb.existingSecretName}
                    onChange={(e) => updateNested('lrdb', 'existingSecretName', e.target.value)}
                    placeholder="pg-credentials"
                    className={!state.lrdb.existingSecretName.trim() ? styles.inputError : ''}
                  />
                  <span className={styles.hint}>Name of existing Kubernetes secret containing password (key: LRDB_PASSWORD)</span>
                </div>
              )}
              <div className={styles.formGroup}>
                <label>SSL Mode</label>
                <select
                  value={state.lrdb.sslMode}
                  onChange={(e) => updateNested('lrdb', 'sslMode', e.target.value)}
                >
                  <option value="disable">disable</option>
                  <option value="require">require</option>
                  <option value="verify-ca">verify-ca</option>
                  <option value="verify-full">verify-full</option>
                </select>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>PostgreSQL - Config DB</h3>
            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Credentials</label>
                <div className={styles.credentialModeSelect}>
                  <button
                    className={`${styles.credentialModeBtn} ${state.configdb.credentialMode === 'create' ? styles.active : ''}`}
                    onClick={() => updateNested('configdb', 'credentialMode', 'create')}
                  >
                    Create Secret
                  </button>
                  <button
                    className={`${styles.credentialModeBtn} ${state.configdb.credentialMode === 'existing' ? styles.active : ''}`}
                    onClick={() => updateNested('configdb', 'credentialMode', 'existing')}
                  >
                    Use Existing Secret
                  </button>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Host <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  value={state.configdb.host}
                  onChange={(e) => updateNested('configdb', 'host', e.target.value)}
                  placeholder="config-db.example.com"
                  className={!state.configdb.host.trim() ? styles.inputError : ''}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Port <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  value={state.configdb.port}
                  onChange={(e) => updateNested('configdb', 'port', e.target.value)}
                  placeholder="5432"
                  className={!isValidPort(state.configdb.port) ? styles.inputError : ''}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Database <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  value={state.configdb.database}
                  onChange={(e) => updateNested('configdb', 'database', e.target.value)}
                  placeholder="configdb"
                  className={!state.configdb.database.trim() ? styles.inputError : ''}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Username <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  value={state.configdb.username}
                  onChange={(e) => updateNested('configdb', 'username', e.target.value)}
                  placeholder="lakerunner"
                  className={!state.configdb.username.trim() ? styles.inputError : ''}
                />
                <span className={styles.hint}>lakerunner</span>
              </div>
              {state.configdb.credentialMode === 'create' ? (
                <div className={styles.formGroup}>
                  <label>Password <span className={styles.required}>*</span></label>
                  <input
                    type="password"
                    value={state.configdb.password}
                    onChange={(e) => updateNested('configdb', 'password', e.target.value)}
                    placeholder="••••••••"
                    className={!state.configdb.password.trim() ? styles.inputError : ''}
                  />
                </div>
              ) : (
                <div className={styles.formGroup}>
                  <label>Secret Name <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    value={state.configdb.existingSecretName}
                    onChange={(e) => updateNested('configdb', 'existingSecretName', e.target.value)}
                    placeholder="configdb-credentials"
                    className={!state.configdb.existingSecretName.trim() ? styles.inputError : ''}
                  />
                  <span className={styles.hint}>Name of existing Kubernetes secret containing password (key: CONFIGDB_PASSWORD)</span>
                </div>
              )}
              <div className={styles.formGroup}>
                <label>SSL Mode</label>
                <select
                  value={state.configdb.sslMode}
                  onChange={(e) => updateNested('configdb', 'sslMode', e.target.value)}
                >
                  <option value="disable">disable</option>
                  <option value="require">require</option>
                  <option value="verify-ca">verify-ca</option>
                  <option value="verify-full">verify-full</option>
                </select>
              </div>
            </div>
          </section>

          {/* Kafka Configuration */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Kafka</h3>
            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Credentials</label>
                <div className={styles.credentialModeSelect}>
                  <button
                    className={`${styles.credentialModeBtn} ${state.kafka.credentialMode === 'create' ? styles.active : ''}`}
                    onClick={() => updateNested('kafka', 'credentialMode', 'create')}
                  >
                    Create Secret
                  </button>
                  <button
                    className={`${styles.credentialModeBtn} ${state.kafka.credentialMode === 'existing' ? styles.active : ''}`}
                    onClick={() => updateNested('kafka', 'credentialMode', 'existing')}
                  >
                    Use Existing Secret
                  </button>
                </div>
              </div>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Broker Addresses <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  value={state.kafka.brokers}
                  onChange={(e) => updateNested('kafka', 'brokers', e.target.value)}
                  placeholder="kafka-1:9092,kafka-2:9092,kafka-3:9092"
                  className={!state.kafka.brokers.trim() ? styles.inputError : ''}
                />
              </div>
              <div className={styles.formGroup}>
                <label>SASL Mechanism</label>
                <select
                  value={state.kafka.saslMechanism}
                  onChange={(e) => updateNested('kafka', 'saslMechanism', e.target.value)}
                >
                  <option value="PLAIN">PLAIN</option>
                  <option value="SCRAM-SHA-256">SCRAM-SHA-256</option>
                  <option value="SCRAM-SHA-512">SCRAM-SHA-512</option>
                </select>
              </div>
              {state.kafka.credentialMode === 'create' ? (
                <>
                  <div className={styles.formGroup}>
                    <label>Username <span className={styles.required}>*</span></label>
                    <input
                      type="text"
                      value={state.kafka.username}
                      onChange={(e) => updateNested('kafka', 'username', e.target.value)}
                      placeholder="kafka-user"
                      className={!state.kafka.username.trim() ? styles.inputError : ''}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Password <span className={styles.required}>*</span></label>
                    <input
                      type="password"
                      value={state.kafka.password}
                      onChange={(e) => updateNested('kafka', 'password', e.target.value)}
                      placeholder="••••••••"
                      className={!state.kafka.password.trim() ? styles.inputError : ''}
                    />
                  </div>
                </>
              ) : (
                <div className={styles.formGroup}>
                  <label>Secret Name <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    value={state.kafka.existingSecretName}
                    onChange={(e) => updateNested('kafka', 'existingSecretName', e.target.value)}
                    placeholder="kafka-credentials"
                    className={!state.kafka.existingSecretName.trim() ? styles.inputError : ''}
                  />
                  <span className={styles.hint}>Name of existing Kubernetes secret containing credentials (keys: KAFKA_USERNAME, KAFKA_PASSWORD)</span>
                </div>
              )}
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={state.kafka.useTls}
                    onChange={(e) => updateNested('kafka', 'useTls', e.target.checked)}
                  />
                  Use TLS
                </label>
              </div>
            </div>
          </section>

        </>
      )}

      {/* Generated YAML Output */}
      <section className={styles.section}>
        <div className={styles.outputHeader}>
          <h3 className={styles.sectionTitle}>Generated values.yaml</h3>
          {yaml && (
            <button onClick={handleCopy} className={styles.copyBtn}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
        {yaml ? (
          <pre className={styles.yamlOutput}>{yaml}</pre>
        ) : (
          <div className={styles.configurePrompt}>
            Please complete all required fields (marked with <span className={styles.required}>*</span>) above to generate your values.yaml configuration.
          </div>
        )}

        {state.installType !== 'kind' && yaml && (
          <div className={styles.installInstructions}>
            <h4>Installation Commands</h4>
            {state.enableKeda && (
              <>
                <h4>Step 1: Install KEDA (Required)</h4>
                <p style={{ marginBottom: '1rem' }}>
                  Follow the official KEDA installation guide: <a href="https://keda.sh/docs/latest/deploy/" target="_blank" rel="noopener noreferrer">https://keda.sh/docs/latest/deploy/</a>
                </p>
              </>
            )}
            <h4>{state.enableKeda ? 'Step 2: Install LakeRunner' : 'Install LakeRunner'}</h4>
            <pre className={styles.codeBlock}>
{`# Save the above values.yaml, then run:
helm install lakerunner oci://public.ecr.aws/cardinalhq.io/lakerunner \\
  --values values.yaml \\
  --namespace lakerunner --create-namespace`}
            </pre>
            {state.enableGrafana && (
              <>
                <h4>Access Grafana</h4>
                <pre className={styles.codeBlock}>
{`# Port-forward to access Grafana locally:
kubectl port-forward -n lakerunner svc/grafana 3000:3000

# Then access Grafana at: http://localhost:3000`}
                </pre>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
