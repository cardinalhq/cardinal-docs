export type AWSCredentialMode = 'irsa' | 'static';

export interface CollectorAWSConfig {
  region: string;
  bucket: string;
  endpoint: string;
  credentialMode: AWSCredentialMode;
  roleArn: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface CollectorWizardState {
  namespace: string;
  clusterName: string;
  organizationId: string;
  aws: CollectorAWSConfig;
}

export function createDefaultCollectorState(): CollectorWizardState {
  return {
    namespace: 'collector',
    clusterName: '',
    organizationId: '',
    aws: {
      region: '',
      bucket: '',
      endpoint: '',
      credentialMode: 'static',
      roleArn: '',
      accessKeyId: '',
      secretAccessKey: '',
    },
  };
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid.trim());
}

// DNS-label-ish: lowercase alphanum plus hyphen, 1-63 chars, no leading/trailing hyphen.
export function isValidClusterName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 63) return false;
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(trimmed);
}

// S3 bucket naming rules (simplified): 3-63 chars, lowercase alphanum + hyphen + dot,
// cannot start/end with hyphen or dot, cannot contain consecutive dots.
export function isValidBucket(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 3 || trimmed.length > 63) return false;
  if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(trimmed)) return false;
  if (trimmed.includes('..')) return false;
  return true;
}

export function isValidEndpointUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed === '') return true; // optional
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidRoleArn(arn: string): boolean {
  const trimmed = arn.trim();
  if (trimmed === '') return true; // optional
  return /^arn:aws[a-z-]*:iam::\d{12}:role\/.+$/.test(trimmed);
}

export function isValidRegion(region: string): boolean {
  const trimmed = region.trim();
  return /^[a-z]{2}-[a-z]+-\d+$/.test(trimmed);
}

export function isStateComplete(state: CollectorWizardState): boolean {
  if (!isValidClusterName(state.clusterName)) return false;
  if (!isValidUUID(state.organizationId)) return false;
  if (!isValidBucket(state.aws.bucket)) return false;
  if (!isValidRegion(state.aws.region)) return false;
  if (!isValidEndpointUrl(state.aws.endpoint)) return false;
  if (state.aws.credentialMode === 'irsa') {
    if (state.aws.roleArn.trim() === '') return false;
    if (!isValidRoleArn(state.aws.roleArn)) return false;
  } else {
    if (state.aws.accessKeyId.trim() === '') return false;
    if (state.aws.secretAccessKey.trim() === '') return false;
  }
  return true;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GeneratedOverlay {
  files: GeneratedFile[];
  applyCommand: string;
}

function base64(value: string): string {
  // Works in both browser and node test env.
  if (typeof btoa === 'function') {
    return btoa(value);
  }
  return Buffer.from(value, 'utf-8').toString('base64');
}

function kustomizationYaml(state: CollectorWizardState): string {
  const envPatchTargets = [
    { kind: 'Deployment', name: 'collector-gateway' },
    { kind: 'Deployment', name: 'collector-poller' },
    { kind: 'DaemonSet', name: 'collector-agent' },
  ];

  const patches = envPatchTargets
    .map(
      (t) => `  - path: patch-${t.name}.yaml
    target:
      kind: ${t.kind}
      name: ${t.name}`
    )
    .join('\n');

  const secretBlock =
    state.aws.credentialMode === 'static'
      ? `
secretGenerator:
  - name: aws-credentials
    behavior: replace
    literals:
      - AWS_ACCESS_KEY_ID=${state.aws.accessKeyId}
      - AWS_SECRET_ACCESS_KEY=${state.aws.secretAccessKey}
    options:
      disableNameSuffixHash: true
`
      : '';

  return `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: ${state.namespace}

resources:
  - ../base-collector-manifests

patches:
${patches}
${secretBlock}`;
}

function gatewayPatch(state: CollectorWizardState): string {
  const roleArnEntry =
    state.aws.credentialMode === 'irsa'
      ? state.aws.roleArn
      : '';

  return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: collector-gateway
spec:
  template:
    spec:
      containers:
        - name: collector
          env:
            - name: K8S_CLUSTER_NAME
              value: "${state.clusterName}"
            - name: LAKERUNNER_ORGANIZATION_ID
              value: "${state.organizationId}"
            - name: AWS_REGION
              value: "${state.aws.region}"
            - name: AWS_S3_BUCKET
              value: "${state.aws.bucket}"
            - name: AWS_S3_ENDPOINT
              value: "${state.aws.endpoint}"
            - name: AWS_ROLE_ARN
              value: "${roleArnEntry}"
`;
}

function clusterNamePatch(
  kind: 'Deployment' | 'DaemonSet',
  name: string,
  clusterName: string,
): string {
  return `apiVersion: apps/v1
kind: ${kind}
metadata:
  name: ${name}
spec:
  template:
    spec:
      containers:
        - name: collector
          env:
            - name: K8S_CLUSTER_NAME
              value: "${clusterName}"
`;
}

export function generateCollectorOverlay(
  state: CollectorWizardState,
): GeneratedOverlay | null {
  if (!isStateComplete(state)) return null;

  const files: GeneratedFile[] = [
    { path: 'overlay/kustomization.yaml', content: kustomizationYaml(state) },
    { path: 'overlay/patch-collector-gateway.yaml', content: gatewayPatch(state) },
    {
      path: 'overlay/patch-collector-poller.yaml',
      content: clusterNamePatch('Deployment', 'collector-poller', state.clusterName),
    },
    {
      path: 'overlay/patch-collector-agent.yaml',
      content: clusterNamePatch('DaemonSet', 'collector-agent', state.clusterName),
    },
  ];

  // secretGenerator in kustomization handles static creds; keep a standalone
  // secret file for clarity when users don't want to use kustomize's generator.
  if (state.aws.credentialMode === 'static') {
    files.push({
      path: 'overlay/aws-credentials.secret.yaml',
      content: `apiVersion: v1
kind: Secret
metadata:
  name: aws-credentials
  namespace: ${state.namespace}
type: Opaque
data:
  AWS_ACCESS_KEY_ID: ${base64(state.aws.accessKeyId)}
  AWS_SECRET_ACCESS_KEY: ${base64(state.aws.secretAccessKey)}
`,
    });
  }

  return {
    files,
    applyCommand: `kubectl create namespace ${state.namespace}\nkubectl apply -k overlay/`,
  };
}
