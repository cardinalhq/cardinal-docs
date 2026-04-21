'use client';

import { useCallback, useMemo, useState } from 'react';
import styles from './LakerunnerHelmValuesWizard.module.css';
import {
  type CollectorWizardState,
  type AWSCredentialMode,
  createDefaultCollectorState,
  generateCollectorOverlay,
  isValidBucket,
  isValidClusterName,
  isValidEndpointUrl,
  isValidRegion,
  isValidRoleArn,
  isValidUUID,
} from '../lib/generateCollectorManifests';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function CollectorManifestsWizard() {
  const [state, setState] = useState<CollectorWizardState>(createDefaultCollectorState());
  const [activeFile, setActiveFile] = useState(0);
  const [copied, setCopied] = useState(false);

  const updateTop = useCallback(
    <K extends keyof CollectorWizardState>(key: K, value: CollectorWizardState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const updateAws = useCallback(
    <K extends keyof CollectorWizardState['aws']>(
      key: K,
      value: CollectorWizardState['aws'][K],
    ) => {
      setState((prev) => ({ ...prev, aws: { ...prev.aws, [key]: value } }));
    },
    [],
  );

  const handleGenerateOrgId = () => updateTop('organizationId', generateUUID());

  const overlay = useMemo(() => generateCollectorOverlay(state), [state]);

  const handleCopy = async () => {
    if (!overlay) return;
    const file = overlay.files[activeFile];
    if (!file) return;
    await navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setCredentialMode = (mode: AWSCredentialMode) => updateAws('credentialMode', mode);

  const orgIdInvalid = state.organizationId !== '' && !isValidUUID(state.organizationId);
  const clusterNameInvalid = state.clusterName !== '' && !isValidClusterName(state.clusterName);
  const bucketInvalid = state.aws.bucket !== '' && !isValidBucket(state.aws.bucket);
  const regionInvalid = state.aws.region !== '' && !isValidRegion(state.aws.region);
  const endpointInvalid = !isValidEndpointUrl(state.aws.endpoint);
  const roleArnInvalid =
    state.aws.credentialMode === 'irsa' &&
    state.aws.roleArn !== '' &&
    !isValidRoleArn(state.aws.roleArn);

  return (
    <div className={styles.wizard}>
      <div className={styles.privacyNote}>
        🔒 <strong>Privacy First:</strong> This wizard runs entirely in your browser. No data is sent to any server.
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Identity</h3>
        <p className={styles.hint}>
          The organization ID must match the UUID you set when installing Lakerunner (the{' '}
          <strong>Organization ID</strong> field in the installation wizard). The gateway writes telemetry to{' '}
          <code>otel-raw/&#123;organizationId&#125;/&#123;clusterName&#125;/</code>.
        </p>
        <div className={styles.formGridTwoCol}>
          <div className={styles.formGroup}>
            <label>
              Organization ID <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWithButton}>
              <input
                type="text"
                value={state.organizationId}
                onChange={(e) => updateTop('organizationId', e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className={orgIdInvalid ? styles.inputError : ''}
              />
              <button onClick={handleGenerateOrgId} className={styles.generateBtn}>
                Generate
              </button>
            </div>
            {orgIdInvalid && <span className={styles.errorText}>Must be a valid UUID format</span>}
            <span className={styles.hint}>
              Use the same UUID as your Lakerunner install, or generate a new one.
            </span>
          </div>
          <div className={styles.formGroup}>
            <label>
              Cluster Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={state.clusterName}
              onChange={(e) => updateTop('clusterName', e.target.value)}
              placeholder="prod-us-east"
              className={clusterNameInvalid ? styles.inputError : ''}
            />
            {clusterNameInvalid && (
              <span className={styles.errorText}>
                Lowercase alphanumeric and hyphens only (DNS label, max 63 chars)
              </span>
            )}
            <span className={styles.hint}>
              Applied to agent, poller, and gateway. Used as the S3 prefix segment.
            </span>
          </div>
          <div className={styles.formGroup}>
            <label>Namespace</label>
            <input
              type="text"
              value={state.namespace}
              onChange={(e) => updateTop('namespace', e.target.value)}
              placeholder="collector"
            />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>S3 Destination</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>
              S3 Bucket <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={state.aws.bucket}
              onChange={(e) => updateAws('bucket', e.target.value)}
              placeholder="my-lakerunner-bucket"
              className={bucketInvalid ? styles.inputError : ''}
            />
            {bucketInvalid && (
              <span className={styles.errorText}>Invalid S3 bucket name</span>
            )}
          </div>
          <div className={styles.formGroup}>
            <label>
              Region <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={state.aws.region}
              onChange={(e) => updateAws('region', e.target.value)}
              placeholder="us-east-1"
              className={regionInvalid ? styles.inputError : ''}
            />
            {regionInvalid && (
              <span className={styles.errorText}>Expected format like us-east-1</span>
            )}
          </div>
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Endpoint</label>
            <input
              type="text"
              value={state.aws.endpoint}
              onChange={(e) => updateAws('endpoint', e.target.value)}
              placeholder="Leave blank for AWS S3"
              className={endpointInvalid ? styles.inputError : ''}
            />
            {endpointInvalid && (
              <span className={styles.errorText}>Must be an http(s) URL if set</span>
            )}
            <span className={styles.hint}>
              Only set for S3-compatible stores (MinIO, R2, GCS-in-S3-mode, etc.). AWS S3 uses the default for the region.
            </span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Credentials</h3>
        <div className={styles.formGrid}>
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <div className={styles.credentialModeSelect}>
              <button
                className={`${styles.credentialModeBtn} ${state.aws.credentialMode === 'irsa' ? styles.active : ''}`}
                onClick={() => setCredentialMode('irsa')}
              >
                IRSA / IAM Role
              </button>
              <button
                className={`${styles.credentialModeBtn} ${state.aws.credentialMode === 'static' ? styles.active : ''}`}
                onClick={() => setCredentialMode('static')}
              >
                Static Access Keys
              </button>
            </div>
          </div>
          {state.aws.credentialMode === 'irsa' && (
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label>
                Role ARN <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={state.aws.roleArn}
                onChange={(e) => updateAws('roleArn', e.target.value)}
                placeholder="arn:aws:iam::123456789012:role/collector-gateway"
                className={roleArnInvalid || state.aws.roleArn === '' ? styles.inputError : ''}
              />
              {roleArnInvalid && (
                <span className={styles.errorText}>
                  Expected format like arn:aws:iam::123456789012:role/name
                </span>
              )}
              <span className={styles.hint}>
                Make sure the gateway&apos;s ServiceAccount is annotated for IRSA or bound to a Pod Identity association.
              </span>
            </div>
          )}
          {state.aws.credentialMode === 'static' && (
            <>
              <div className={styles.formGroup}>
                <label>
                  Access Key ID <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={state.aws.accessKeyId}
                  onChange={(e) => updateAws('accessKeyId', e.target.value)}
                  placeholder="AKIA..."
                  className={state.aws.accessKeyId === '' ? styles.inputError : ''}
                />
              </div>
              <div className={styles.formGroup}>
                <label>
                  Secret Access Key <span className={styles.required}>*</span>
                </label>
                <input
                  type="password"
                  value={state.aws.secretAccessKey}
                  onChange={(e) => updateAws('secretAccessKey', e.target.value)}
                  placeholder="••••••••"
                  className={state.aws.secretAccessKey === '' ? styles.inputError : ''}
                />
              </div>
            </>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.outputHeader}>
          <h3 className={styles.sectionTitle}>Generated Overlay</h3>
          {overlay && (
            <button onClick={handleCopy} className={styles.copyBtn}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
        {overlay ? (
          <>
            <div className={styles.providerSelect} data-testid="collector-wizard-tabs">
              {overlay.files.map((file, idx) => (
                <button
                  key={file.path}
                  className={`${styles.providerBtn} ${idx === activeFile ? styles.active : ''}`}
                  onClick={() => setActiveFile(idx)}
                >
                  {file.path.replace(/^overlay\//, '')}
                </button>
              ))}
            </div>
            <pre className={styles.yamlOutput} data-testid="collector-wizard-output">
              {overlay.files[activeFile]?.content}
            </pre>
            <div className={styles.installInstructions}>
              <h4>Deploy</h4>
              <pre className={styles.codeBlock}>{`# Save the files above into an overlay/ directory next to base-collector-manifests/, then:
${overlay.applyCommand}`}</pre>
            </div>
          </>
        ) : (
          <div className={styles.configurePrompt}>
            Please complete all required fields (marked with <span className={styles.required}>*</span>) above to
            generate your overlay.
          </div>
        )}
      </section>
    </div>
  );
}
