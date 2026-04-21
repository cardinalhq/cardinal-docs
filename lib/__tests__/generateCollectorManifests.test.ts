import {
  type CollectorWizardState,
  createDefaultCollectorState,
  generateCollectorOverlay,
  isStateComplete,
  isValidBucket,
  isValidClusterName,
  isValidEndpointUrl,
  isValidRegion,
  isValidRoleArn,
  isValidUUID,
} from '../generateCollectorManifests';

function createValidState(): CollectorWizardState {
  return {
    namespace: 'collector',
    clusterName: 'prod-us-east',
    organizationId: 'b3a870ae-2c05-42b9-b073-572e718ad39d',
    aws: {
      region: 'us-east-1',
      bucket: 'my-lakerunner-bucket',
      endpoint: '',
      credentialMode: 'static',
      roleArn: '',
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    },
  };
}

describe('validators', () => {
  describe('isValidUUID', () => {
    it('accepts well-formed UUIDs', () => {
      expect(isValidUUID('b3a870ae-2c05-42b9-b073-572e718ad39d')).toBe(true);
    });
    it('rejects malformed UUIDs', () => {
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('b3a870ae-2c05-42b9-b073')).toBe(false);
    });
  });

  describe('isValidClusterName', () => {
    it('accepts valid DNS labels', () => {
      expect(isValidClusterName('prod')).toBe(true);
      expect(isValidClusterName('prod-us-east-1')).toBe(true);
      expect(isValidClusterName('a1')).toBe(true);
    });
    it('rejects invalid names', () => {
      expect(isValidClusterName('')).toBe(false);
      expect(isValidClusterName('-leading')).toBe(false);
      expect(isValidClusterName('trailing-')).toBe(false);
      expect(isValidClusterName('UPPER')).toBe(false);
      expect(isValidClusterName('has_underscore')).toBe(false);
      expect(isValidClusterName('a'.repeat(64))).toBe(false);
    });
  });

  describe('isValidBucket', () => {
    it('accepts typical bucket names', () => {
      expect(isValidBucket('my-bucket')).toBe(true);
      expect(isValidBucket('bucket.with.dots')).toBe(true);
      expect(isValidBucket('abc')).toBe(true);
    });
    it('rejects invalid names', () => {
      expect(isValidBucket('ab')).toBe(false);
      expect(isValidBucket('Has-Upper')).toBe(false);
      expect(isValidBucket('-starts-with-hyphen')).toBe(false);
      expect(isValidBucket('double..dots')).toBe(false);
      expect(isValidBucket('a'.repeat(64))).toBe(false);
    });
  });

  describe('isValidEndpointUrl', () => {
    it('accepts empty (optional)', () => {
      expect(isValidEndpointUrl('')).toBe(true);
    });
    it('accepts http(s) URLs', () => {
      expect(isValidEndpointUrl('https://s3.us-west-2.amazonaws.com')).toBe(true);
      expect(isValidEndpointUrl('http://minio.internal:9000')).toBe(true);
    });
    it('rejects non-http schemes and garbage', () => {
      expect(isValidEndpointUrl('s3://bucket')).toBe(false);
      expect(isValidEndpointUrl('not a url')).toBe(false);
    });
  });

  describe('isValidRoleArn', () => {
    it('accepts empty (optional)', () => {
      expect(isValidRoleArn('')).toBe(true);
    });
    it('accepts IAM role ARNs', () => {
      expect(isValidRoleArn('arn:aws:iam::123456789012:role/my-role')).toBe(true);
      expect(isValidRoleArn('arn:aws:iam::123456789012:role/path/to/role')).toBe(true);
      expect(isValidRoleArn('arn:aws-cn:iam::123456789012:role/cn-role')).toBe(true);
    });
    it('rejects malformed ARNs', () => {
      expect(isValidRoleArn('arn:aws:iam::role/my-role')).toBe(false);
      expect(isValidRoleArn('arn:aws:s3:::my-bucket')).toBe(false);
      expect(isValidRoleArn('arn:aws:iam::123:role/my-role')).toBe(false);
    });
  });

  describe('isValidRegion', () => {
    it('accepts AWS region shapes', () => {
      expect(isValidRegion('us-east-1')).toBe(true);
      expect(isValidRegion('eu-west-3')).toBe(true);
      expect(isValidRegion('ap-southeast-2')).toBe(true);
    });
    it('rejects non-region strings', () => {
      expect(isValidRegion('')).toBe(false);
      expect(isValidRegion('us_east_1')).toBe(false);
      expect(isValidRegion('East US')).toBe(false);
    });
  });
});

describe('isStateComplete', () => {
  it('accepts a valid static-creds state', () => {
    expect(isStateComplete(createValidState())).toBe(true);
  });

  it('accepts a valid IRSA state', () => {
    const state = createValidState();
    state.aws.credentialMode = 'irsa';
    state.aws.roleArn = 'arn:aws:iam::123456789012:role/collector-gateway';
    state.aws.accessKeyId = '';
    state.aws.secretAccessKey = '';
    expect(isStateComplete(state)).toBe(true);
  });

  it('rejects when required identity fields are missing', () => {
    const state = createValidState();
    state.clusterName = '';
    expect(isStateComplete(state)).toBe(false);
  });

  it('rejects when bucket or region is malformed', () => {
    const state = createValidState();
    state.aws.bucket = 'BadBucket';
    expect(isStateComplete(state)).toBe(false);
  });

  it('rejects IRSA mode without role ARN', () => {
    const state = createValidState();
    state.aws.credentialMode = 'irsa';
    state.aws.roleArn = '';
    expect(isStateComplete(state)).toBe(false);
  });

  it('rejects static mode without access keys', () => {
    const state = createValidState();
    state.aws.credentialMode = 'static';
    state.aws.accessKeyId = '';
    expect(isStateComplete(state)).toBe(false);
  });

  it('rejects invalid endpoint', () => {
    const state = createValidState();
    state.aws.endpoint = 'ftp://example.com';
    expect(isStateComplete(state)).toBe(false);
  });
});

describe('generateCollectorOverlay', () => {
  it('returns null when state is incomplete', () => {
    expect(generateCollectorOverlay(createDefaultCollectorState())).toBeNull();
  });

  it('emits overlay files for static creds', () => {
    const overlay = generateCollectorOverlay(createValidState())!;
    expect(overlay).not.toBeNull();

    const paths = overlay.files.map((f) => f.path);
    expect(paths).toEqual([
      'overlay/kustomization.yaml',
      'overlay/patch-collector-gateway.yaml',
      'overlay/patch-collector-poller.yaml',
      'overlay/patch-collector-agent.yaml',
      'overlay/aws-credentials.secret.yaml',
    ]);
  });

  it('omits the secret file when using IRSA', () => {
    const state = createValidState();
    state.aws.credentialMode = 'irsa';
    state.aws.roleArn = 'arn:aws:iam::123456789012:role/collector-gateway';
    state.aws.accessKeyId = '';
    state.aws.secretAccessKey = '';

    const overlay = generateCollectorOverlay(state)!;
    const paths = overlay.files.map((f) => f.path);
    expect(paths).not.toContain('overlay/aws-credentials.secret.yaml');
  });

  it('stamps cluster name into all three workload patches', () => {
    const state = createValidState();
    state.clusterName = 'my-cluster';
    const overlay = generateCollectorOverlay(state)!;

    const findContent = (name: string) =>
      overlay.files.find((f) => f.path.endsWith(name))!.content;

    expect(findContent('patch-collector-gateway.yaml')).toContain('value: "my-cluster"');
    expect(findContent('patch-collector-poller.yaml')).toContain('value: "my-cluster"');
    expect(findContent('patch-collector-agent.yaml')).toContain('value: "my-cluster"');
  });

  it('sets organization id and S3 config only on the gateway patch', () => {
    const overlay = generateCollectorOverlay(createValidState())!;
    const gateway = overlay.files.find((f) => f.path.endsWith('patch-collector-gateway.yaml'))!.content;
    const poller = overlay.files.find((f) => f.path.endsWith('patch-collector-poller.yaml'))!.content;

    expect(gateway).toContain('LAKERUNNER_ORGANIZATION_ID');
    expect(gateway).toContain('AWS_S3_BUCKET');
    expect(gateway).toContain('AWS_REGION');
    expect(gateway).toContain('AWS_S3_ENDPOINT');
    expect(gateway).toContain('AWS_ROLE_ARN');

    expect(poller).not.toContain('LAKERUNNER_ORGANIZATION_ID');
    expect(poller).not.toContain('AWS_S3_BUCKET');
  });

  it('writes role ARN into gateway patch only in IRSA mode', () => {
    const irsaState = createValidState();
    irsaState.aws.credentialMode = 'irsa';
    irsaState.aws.roleArn = 'arn:aws:iam::123456789012:role/collector-gateway';
    irsaState.aws.accessKeyId = '';
    irsaState.aws.secretAccessKey = '';

    const irsaOverlay = generateCollectorOverlay(irsaState)!;
    const irsaGateway = irsaOverlay.files.find((f) => f.path.endsWith('patch-collector-gateway.yaml'))!.content;
    expect(irsaGateway).toContain('arn:aws:iam::123456789012:role/collector-gateway');

    const staticOverlay = generateCollectorOverlay(createValidState())!;
    const staticGateway = staticOverlay.files.find((f) => f.path.endsWith('patch-collector-gateway.yaml'))!.content;
    // In static mode, AWS_ROLE_ARN should be present but empty.
    expect(staticGateway).toMatch(/AWS_ROLE_ARN\s*\n\s*value: ""/);
  });

  it('base64-encodes static credentials in the secret', () => {
    const overlay = generateCollectorOverlay(createValidState())!;
    const secret = overlay.files.find((f) => f.path.endsWith('aws-credentials.secret.yaml'))!.content;

    const expectedAk = Buffer.from('AKIAIOSFODNN7EXAMPLE', 'utf-8').toString('base64');
    const expectedSk = Buffer.from(
      'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      'utf-8',
    ).toString('base64');
    expect(secret).toContain(`AWS_ACCESS_KEY_ID: ${expectedAk}`);
    expect(secret).toContain(`AWS_SECRET_ACCESS_KEY: ${expectedSk}`);
  });

  it('includes static creds in kustomization secretGenerator, omits otherwise', () => {
    const staticOverlay = generateCollectorOverlay(createValidState())!;
    const staticKust = staticOverlay.files.find((f) => f.path.endsWith('kustomization.yaml'))!.content;
    expect(staticKust).toContain('secretGenerator');
    expect(staticKust).toContain('AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE');

    const irsaState = createValidState();
    irsaState.aws.credentialMode = 'irsa';
    irsaState.aws.roleArn = 'arn:aws:iam::123456789012:role/collector-gateway';
    irsaState.aws.accessKeyId = '';
    irsaState.aws.secretAccessKey = '';

    const irsaOverlay = generateCollectorOverlay(irsaState)!;
    const irsaKust = irsaOverlay.files.find((f) => f.path.endsWith('kustomization.yaml'))!.content;
    expect(irsaKust).not.toContain('secretGenerator');
  });

  it('sets the namespace from state', () => {
    const state = createValidState();
    state.namespace = 'telemetry';
    const overlay = generateCollectorOverlay(state)!;
    const kust = overlay.files.find((f) => f.path.endsWith('kustomization.yaml'))!.content;
    expect(kust).toContain('namespace: telemetry');
    expect(overlay.applyCommand).toContain('kubectl create namespace telemetry');
  });
});
