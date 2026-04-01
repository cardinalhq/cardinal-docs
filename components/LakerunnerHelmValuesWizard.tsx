'use client';

import { useState, useCallback } from 'react';
import styles from './LakerunnerHelmValuesWizard.module.css';
import {
  type InstallType,
  type WizardState,
  isValidCollectorName,
  isValidUUID,
  isValidPort,
  isValidLicenseData,
  createDefaultState,
  generateValuesYaml,
} from '../lib/generateValuesYaml';

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

export default function LakerunnerHelmValuesWizard() {
  const [state, setState] = useState<WizardState>(createDefaultState());
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

  const handleInstallTypeChange = (installType: InstallType) => {
    setState(prev => ({
      ...prev,
      installType,
      // POC: Grafana enabled by default
      // Production: Grafana disabled by default
      enableGrafana: installType === 'poc',
      scaling: installType === 'production'
        ? { processLogsMax: '10', processMetricsMax: '10', processTracesMax: '10' }
        : { processLogsMax: '10', processMetricsMax: '10', processTracesMax: '10' },
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

      {/* Organization Settings */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Organization Settings</h3>
            <p className={styles.hint}>
              Lakerunner is multi-tenant. Each tenant is an organization, and the collector and API key are used by that organization.
            </p>
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
                <span className={styles.hint}>
                  Click "Generate" to make a random ID, or enter one you have previously used.
                </span>
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
                <label>API Key <span className={styles.required}>*</span></label>
                <div className={styles.inputWithButton}>
                  <input
                    type="text"
                    value={state.apiKey}
                    onChange={(e) => updateState('apiKey', e.target.value)}
                    placeholder="chq_..."
                    className={!state.apiKey.trim() ? styles.inputError : ''}
                  />
                  <button onClick={handleGenerateApiKey} className={styles.generateBtn}>
                    Generate
                  </button>
                </div>
                <span className={styles.hint}>
                  This will be used by Grafana and other tools to query telemetry for this organization.
                </span>
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
              <span className={styles.hint}>Pre-configured Grafana with Lakerunner datasources</span>
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
                className={`${styles.providerBtn} ${state.cloudProvider === 'gcp' ? styles.active : ''}`}
                onClick={() => updateState('cloudProvider', 'gcp')}
              >
                GCP
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
                        className={`${styles.credentialModeBtn} ${state.aws.credentialMode === 'eks' ? styles.active : ''}`}
                        onClick={() => updateNested('aws', 'credentialMode', 'eks')}
                      >
                        EKS (IRSA/Pod Identity)
                      </button>
                      <button
                        className={`${styles.credentialModeBtn} ${state.aws.credentialMode === 'existing' ? styles.active : ''}`}
                        onClick={() => updateNested('aws', 'credentialMode', 'existing')}
                      >
                        Use Existing Secret
                      </button>
                      <button
                        className={`${styles.credentialModeBtn} ${state.aws.credentialMode === 'create' ? styles.active : ''}`}
                        onClick={() => updateNested('aws', 'credentialMode', 'create')}
                      >
                        Create Secret
                      </button>
                    </div>
                  </div>
                  {state.aws.credentialMode === 'eks' && (
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <span className={styles.hint}>
                        Credentials will be provided by EKS via IAM Roles for Service Accounts (IRSA) or EKS Pod Identity.
                        Ensure your cluster and service account are configured appropriately.
                      </span>
                    </div>
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
                </>
              )}

              {state.cloudProvider === 'gcp' && (
                <>
                  <div className={styles.formGroup}>
                    <label>GCS Bucket Name <span className={styles.required}>*</span></label>
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
                      placeholder="us-central1"
                      className={!state.storage.region.trim() ? styles.inputError : ''}
                    />
                  </div>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Credentials</label>
                    <div className={styles.credentialModeSelect}>
                      <button
                        className={`${styles.credentialModeBtn} ${state.gcp.credentialMode === 'workload_identity' ? styles.active : ''}`}
                        onClick={() => updateNested('gcp', 'credentialMode', 'workload_identity')}
                      >
                        Workload Identity
                      </button>
                      <button
                        className={`${styles.credentialModeBtn} ${state.gcp.credentialMode === 'existing' ? styles.active : ''}`}
                        onClick={() => updateNested('gcp', 'credentialMode', 'existing')}
                      >
                        Use Existing Secret
                      </button>
                      <button
                        className={`${styles.credentialModeBtn} ${state.gcp.credentialMode === 'service_account' ? styles.active : ''}`}
                        onClick={() => updateNested('gcp', 'credentialMode', 'service_account')}
                      >
                        Service Account JSON
                      </button>
                    </div>
                  </div>
                  {state.gcp.credentialMode === 'workload_identity' && (
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <span className={styles.hint}>
                        Credentials will be provided by GKE Workload Identity. Ensure your cluster and service account are configured appropriately.
                      </span>
                    </div>
                  )}
                  {state.gcp.credentialMode === 'existing' && (
                    <div className={styles.formGroup}>
                      <label>Secret Name <span className={styles.required}>*</span></label>
                      <input
                        type="text"
                        value={state.gcp.existingSecretName}
                        onChange={(e) => updateNested('gcp', 'existingSecretName', e.target.value)}
                        placeholder="my-gcp-credentials"
                        className={!state.gcp.existingSecretName.trim() ? styles.inputError : ''}
                      />
                      <span className={styles.hint}>Name of existing Kubernetes secret containing GOOGLE_APPLICATION_CREDENTIALS</span>
                    </div>
                  )}
                  {state.gcp.credentialMode === 'service_account' && (
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label>Service Account JSON <span className={styles.required}>*</span></label>
                      <textarea
                        value={state.gcp.serviceAccountJson}
                        onChange={(e) => updateNested('gcp', 'serviceAccountJson', e.target.value)}
                        placeholder='{"type": "service_account", ...}'
                        rows={4}
                        className={!state.gcp.serviceAccountJson.trim() ? styles.inputError : ''}
                      />
                    </div>
                  )}
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
            <h3 className={styles.sectionTitle}>PostgreSQL - Lakerunner DB</h3>
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

          {/* License Configuration */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>License</h3>
            <p className={styles.hint}>
              A valid license is required for Lakerunner to operate. Contact <a href="mailto:support@cardinalhq.com">support@cardinalhq.com</a> to obtain one.
            </p>
            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>License Source</label>
                <div className={styles.credentialModeSelect}>
                  <button
                    className={`${styles.credentialModeBtn} ${state.license.mode === 'create' ? styles.active : ''}`}
                    onClick={() => updateNested('license', 'mode', 'create')}
                  >
                    Provide License Data
                  </button>
                  <button
                    className={`${styles.credentialModeBtn} ${state.license.mode === 'existing' ? styles.active : ''}`}
                    onClick={() => updateNested('license', 'mode', 'existing')}
                  >
                    Use Existing Secret
                  </button>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Secret Name</label>
                <input
                  type="text"
                  value={state.license.secretName}
                  onChange={(e) => updateNested('license', 'secretName', e.target.value)}
                  placeholder="lakerunner-license"
                />
              </div>
              {state.license.mode === 'create' ? (
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>License Data <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    value={state.license.data}
                    onChange={(e) => updateNested('license', 'data', e.target.value)}
                    placeholder='b64:... or z64:...'
                    className={state.license.data.trim() && !isValidLicenseData(state.license.data) ? styles.inputError : ''}
                  />
                  {state.license.data.trim() && !isValidLicenseData(state.license.data) && (
                    <span className={styles.errorText}>
                      License must start with "b64:" or "z64:"
                    </span>
                  )}
                  <span className={styles.hint}>Paste your license string (starts with b64: or z64:)</span>
                </div>
              ) : (
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <span className={styles.hint}>
                    The secret must contain your license data under the key "license.json".
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Scaling Configuration */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Scaling</h3>
            <p className={styles.hint}>
              Lakerunner uses internal autoscaling from 1 pod up to the max you set here.
            </p>
            <table className={styles.scalingTable}>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Max Pods</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Log Processing</td>
                  <td>
                    <input
                      type="text"
                      value={state.scaling.processLogsMax}
                      onChange={(e) => updateNested('scaling', 'processLogsMax', e.target.value)}
                      placeholder="10"
                    />
                  </td>
                </tr>
                <tr>
                  <td>Metric Processing</td>
                  <td>
                    <input
                      type="text"
                      value={state.scaling.processMetricsMax}
                      onChange={(e) => updateNested('scaling', 'processMetricsMax', e.target.value)}
                      placeholder="10"
                    />
                  </td>
                </tr>
                <tr>
                  <td>Trace Processing</td>
                  <td>
                    <input
                      type="text"
                      value={state.scaling.processTracesMax}
                      onChange={(e) => updateNested('scaling', 'processTracesMax', e.target.value)}
                      placeholder="10"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* PubSub Configuration */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Ingestion</h3>
            {state.cloudProvider === 'gcp' ? (
              <>
                <p className={styles.hint}>
                  GCP uses Pub/Sub for ingestion from Cloud Storage notifications.
                </p>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>GCP Project ID <span className={styles.required}>*</span></label>
                    <input
                      type="text"
                      value={state.pubsub.gcpProjectID}
                      onChange={(e) => updateNested('pubsub', 'gcpProjectID', e.target.value)}
                      placeholder="my-project-123456"
                      className={!state.pubsub.gcpProjectID.trim() ? styles.inputError : ''}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Subscription ID <span className={styles.required}>*</span></label>
                    <input
                      type="text"
                      value={state.pubsub.gcpSubscriptionID}
                      onChange={(e) => updateNested('pubsub', 'gcpSubscriptionID', e.target.value)}
                      placeholder="my-subscription"
                      className={!state.pubsub.gcpSubscriptionID.trim() ? styles.inputError : ''}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Replicas</label>
                    <input
                      type="text"
                      value={state.pubsub.gcpReplicas}
                      onChange={(e) => updateNested('pubsub', 'gcpReplicas', e.target.value)}
                      placeholder="1"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className={styles.hint}>
                  Choose how S3 object notifications are ingested. HTTP provides a webhook endpoint. SQS polls from an AWS SQS queue.
                </p>
                <div className={styles.providerSelect}>
                  <button
                    className={`${styles.providerBtn} ${state.pubsub.type === 'http' ? styles.active : ''}`}
                    onClick={() => updateNested('pubsub', 'type', 'http')}
                  >
                    HTTP (Webhook)
                  </button>
                  <button
                    className={`${styles.providerBtn} ${state.pubsub.type === 'sqs' ? styles.active : ''}`}
                    onClick={() => updateNested('pubsub', 'type', 'sqs')}
                  >
                    SQS
                  </button>
                </div>

                {state.pubsub.type === 'http' && (
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Replicas</label>
                      <input
                        type="text"
                        value={state.pubsub.httpReplicas}
                        onChange={(e) => updateNested('pubsub', 'httpReplicas', e.target.value)}
                        placeholder="2"
                      />
                      <span className={styles.hint}>Recommend at least 2 for production</span>
                    </div>
                  </div>
                )}

                {state.pubsub.type === 'sqs' && (
                  <div className={styles.formGrid}>
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label>SQS Queue URL <span className={styles.required}>*</span></label>
                      <input
                        type="text"
                        value={state.pubsub.sqsQueueURL}
                        onChange={(e) => updateNested('pubsub', 'sqsQueueURL', e.target.value)}
                        placeholder="https://sqs.us-east-2.amazonaws.com/123456789012/my-queue"
                        className={!state.pubsub.sqsQueueURL.trim() ? styles.inputError : ''}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Replicas</label>
                      <input
                        type="text"
                        value={state.pubsub.sqsReplicas}
                        onChange={(e) => updateNested('pubsub', 'sqsReplicas', e.target.value)}
                        placeholder="2"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Region</label>
                      <input
                        type="text"
                        value={state.pubsub.sqsRegion}
                        onChange={(e) => updateNested('pubsub', 'sqsRegion', e.target.value)}
                        placeholder="Defaults to cloud provider region"
                      />
                      <span className={styles.hint}>Leave blank to use the AWS region above</span>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Role ARN</label>
                      <input
                        type="text"
                        value={state.pubsub.sqsRoleARN}
                        onChange={(e) => updateNested('pubsub', 'sqsRoleARN', e.target.value)}
                        placeholder="arn:aws:iam::123456789012:role/my-role"
                      />
                      <span className={styles.hint}>Optional IAM role to assume for SQS access</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

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

        {yaml && (
          <div className={styles.installInstructions}>
            <h4>Installation Commands</h4>
            <h4>Install Lakerunner</h4>
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
