---
name: install-cardinal-data-lake
description: Install Cardinal Data Lake (Lakerunner) on any Kubernetes cluster, including managed Kubernetes with S3-compatible object storage and externally managed PostgreSQL. Use when asked to deploy, install or size Lakerunner or Cardinal Data Lake.
---

# Install Cardinal Data Lake

Last checked against chart 4.2.2 (Lakerunner v1.98.1). Provider references reviewed 2026-10-30.
These are deployment instructions, not evidence that every provider combination has been run.

How far this guide has been tested, which you should tell the operator before you start:

- Values, secrets, Postgres connection numbers and troubleshooting: tested on a self-hosted cluster.
- HTTP, SQS and GCP values examples: rendered against the public OCI chart 4.2.2; this checks manifests, not provider IAM or ingestion.
- Collector gateway `notifications`: checked against the exporter source, not retested end to end for this guide.
- Managed Kubernetes, VPS object storage and managed PostgreSQL: **not run yet**. Expect to find problems, and report them to support@cardinalhq.io.

## Rules

- Find out before you ask. Use what you already know about this operator's infrastructure, plus their kubeconfig, cloud CLI and infrastructure code. State what you found in one line and ask them to confirm it. Only ask what you can't find out.
- Ask one decision at a time. Put your recommendation first and give the reason.
- Never print secrets, commit them, or put them on a command line. Create Kubernetes Secrets from files and refer to them by name.
- Get approval before anything that costs money, exposes a service, or deletes data.
- The chart wins over this guide. Select and record a chart version (4.2.2 is the checked baseline). Use that same version for `helm show values`, `helm template`, install and upgrade; review changes before choosing a newer version. The public source is https://github.com/cardinalhq/charts/tree/main/lakerunner.
- Use public Cardinal and provider documentation for implementation details. A Cardinal account/site or an operator-provided license and cloud credentials are still required; public documentation cannot supply them.
- You are not done until you have queried a record back.

## 1. Discover

### If there is no cluster yet

Choose a provider and region with the operator, then use its public bootstrap guide below. Prepare the infrastructure plan before requesting authorization to create paid resources. Follow existing Terraform/OpenTofu or other infrastructure code when available. Record account/project, Kubernetes version, node pools, disk, private networking, database, bucket, credential sources and estimated costs. Do not guess resource IDs, endpoints, IAM bindings or currently available plans.

| Target | Public bootstrap reference | Before installing Cardinal |
|---|---|---|
| AWS EKS | https://docs.aws.amazon.com/eks/latest/userguide/create-cluster.html | Create worker nodes as well as the control plane; retrieve kubeconfig with `aws eks update-kubeconfig`. For ordinary EKS with EBS-backed PVCs, configure the EBS CSI driver and its IAM permissions: https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html. Check the actual default StorageClass rather than assuming a class name. Use S3 + SQS below, or the portable S3 route |
| Google GKE | https://docs.cloud.google.com/kubernetes-engine/docs/how-to/creating-a-zonal-cluster | Start with Standard for this untested recipe; review regional clusters for production. Retrieve kubeconfig with `gcloud container clusters get-credentials`. Native GCS needs the GCP overlay and writer credentials below. GKE can also use an external S3-compatible store with the portable recipe |
| OVHcloud Managed Kubernetes | https://docs.ovhcloud.com/en/guides/public-cloud/containers-orchestration/managed-kubernetes/create-cluster | Create a Public Cloud project, cluster and node pool; download kubeconfig. Verify the region's StorageClass, private network and PostgreSQL reachability. Use the S3 API endpoint and credentials for the selected Object Storage region, not Swift credentials |
| OVHcloud VPS/dedicated servers, Hetzner or another Linux VPS host | https://docs.k3s.io/quick-start and https://docs.k3s.io/installation/requirements | Provision Linux hosts and install a supported Kubernetes release first. Size for Cardinal plus Kubernetes, not K3s's own minimum. Verify container image architecture support. Keep node/control-plane traffic on private networking or a VPN and restrict administrative access. Node-local storage does not survive node loss; use durable volumes/database and backups for production. Use the portable S3 recipe |

A VPS is a machine, not a managed Kubernetes service. Do not assume it includes a CSI driver, external LoadBalancer implementation, private network, object store or managed database. A single-node POC has no node-failure tolerance. Port-forwarding is sufficient for initial verification; a public ingress is optional.

### Inspect the selected cluster

Run these and keep the non-secret results:

```bash
kubectl config current-context
kubectl version
kubectl auth can-i '*' '*' --all-namespaces
kubectl get nodes -o wide
kubectl describe nodes | grep -E 'Taints|cpu:|memory:|ephemeral-storage:'
kubectl get storageclass
kubectl get deploy -A | grep -E 'metrics-server|cert-manager|ingress|traefik'
helm version --short
```

Stop and tell the operator if any of these fail:

- Kubernetes is at least 1.33.
- Helm is at least 3.14.
- You have cluster-admin, if the operator-managed install is used.
- A default StorageClass exists.

Warn if there's no metrics-server, because the workers scale on CPU.

Confirm the kubecontext with the operator before making any change. Check allocatable resources and the largest pod against each node, not just total advertised vCPUs/RAM. Allow headroom for collectors, Kubernetes, rolling updates and worker scale-up. Confirm the cluster can resolve and reach the database, object store, notification API, public image registries and (for the operator) Cardinal over HTTPS.

## 2. Ask

Skip any question you can already answer.

1. **Install method.** Recommend the operator (https://docs.cardinalhq.io/data-lake/install): it handles upgrades and health. It needs a Cardinal account, outbound HTTPS, and a site created at app.cardinalhq.io. Use manual Helm if they already have a license file and want to run the chart themselves. Cardinal supports manual Helm for POCs, not production.
2. **Purpose.** POC or production? Production needs storage and a database that outlive the cluster.
3. **Object storage.** Which provider and region? Use an existing bucket, or create one?
4. **Where telemetry comes from.** Cardinal collector, other OTel collector, Grafana Alloy, or something else? In this cluster or elsewhere? This decides step 3.
5. **PostgreSQL.** Which service and plan? Can the cluster reach it privately?
6. **License.** The file path, or a license that's already in a Secret.
7. **Access.** Port-forward only, or an Ingress with TLS? Which hostnames?
8. **Size.** Roughly how much telemetry? Use https://docs.cardinalhq.io/data-lake/sizing.
9. **Deployment method.** Helm by hand, GitOps, or their infrastructure code? Follow what they already use.

## 3. Choose how Lakerunner learns about new objects

Lakerunner only processes an object after it gets an event. If this is wrong, the bucket fills and nothing is ingested, with no error.

| Storage | Route |
|---|---|
| AWS S3 | Bucket events through SQS: `pubsub.SQS` |
| Google Cloud Storage | Pub/Sub: `pubsub.GCP` |
| Azure Blob | `pubsub.Azure`. Check with support@cardinalhq.io first, because this route hasn't been tested for this guide |
| S3-compatible, written by the Cardinal collector | **Collector gateway notifications** (default) |
| S3-compatible with documented webhook events | Bucket events to `pubsub.HTTP` |
| S3-compatible, other writer, no events | Stop and explain. There is no supported route here. Offer the Cardinal gateway |

The Kubernetes host and object-store provider are independent choices: GKE with an S3 bucket still uses the AWS/S3-compatible values. S3 API compatibility alone does not establish event compatibility.

For OVHcloud, start with collector gateway notifications. Its public S3 compliance table marks bucket notification configuration unsupported: https://github.com/ovh/docs/blob/develop/pages/storage_and_backup/object_storage/s3_s3_compliancy/guide.en-gb.md. The event-notification roadmap is not proof of a working webhook: https://github.com/ovh/public-cloud-roadmap/issues/437. Use the selected region's S3 endpoint from https://docs.ovhcloud.com/en/guides/storage-and-backup/object-storage/landing-page-object-storage. Recheck provider capabilities when deploying.

Assume a VPS provider's object storage has no usable bucket events unless its docs specify the destination and payload. Check with:

```bash
aws --endpoint-url "$S3_ENDPOINT" s3api get-bucket-notification-configuration --bucket "$BUCKET"
```

`NotImplemented` means no. Success doesn't prove it can send webhooks.

**Collector gateway notifications.** These need Cardinal collector v1.7.0 or later. Add `notifications` to the `s3uploader` block of the gateway's `awss3` exporter, and leave the webhook Service as ClusterIP:

```yaml
exporters:
  awss3:
    s3uploader:
      notifications:
        endpoint: http://<release>-pubsub-http.<namespace>.svc.cluster.local:8080/
```

Tell the operator the limits:

- The queue is in memory, with 3 delivery attempts by default.
- A dropped notification leaves that object unprocessed.
- Nothing else writing to the bucket produces an event.

**Webhook.** It listens on port 8080 and accepts POST on any path with an S3 `Records` JSON body. It has **no authentication**. If it must be reachable from outside the cluster, restrict it by network and get approval first. Use only one route, and don't run both unless you've checked what duplicate events do.

## 4. Prepare

**Bucket.** For the portable S3 route, create it and a key scoped to that bucket. Lakerunner needs list/read/write/delete for ingestion, compaction and retention; the writer needs upload permissions. Include multipart and encryption-key permissions where applicable. Test write/read/delete of a disposable object with the chosen credentials and endpoint before installing. Set `endpoint` in the storage profile. The chart README says `use_path_style` should be `true`; if the provider only supports virtual-hosted URLs, test an upload and read before installing. Use the region name the provider expects.

**PostgreSQL.**

- Version 16 or later, with two databases such as `lakerunner` and `configdb`. One role owning both works.
- Allow the cluster's private network, or its egress IPs, and use `sslMode: require`. Stricter modes aren't covered here.
- **Connections matter.** A minimum-replica install held 66 to 98 while idle, and scale-up adds more. Plan for at least 200. Where the limit depends on the plan, this decides the plan, so read the limit from the provider's current plan table. For example, DigitalOcean listed 197 backend connections for 8 GiB in October 2026, and new Standard Edition clusters there can't use plans above 4 GiB.
- Migrations need a direct connection, because advisory locks don't work through PgBouncer. If the app uses a pooler, point `setup.database.lrdb` and `setup.configdb.lrdb` at the direct address. Start with direct connections everywhere if the limit allows it.
- Only the built-in `plpgsql` extension was present after setup.

**Compute.** Minimum-replica requests are about 16.1 vCPU and 29.3 GiB, plus system overhead and about 0.2 vCPU and 0.3 GiB more with Grafana. Each worker role can scale to 10 replicas, so set a lower `process.logs.autoscaling.maxReplicas`, and the same for `process.metrics` and `process.traces`, on small clusters. Check whether the budget can absorb that.

**Scratch disk.** The query worker defaults to a 100Gi `emptyDir` limit. Compare that with node disk. Either lower `queryWorker.temporaryStorage.size`, or set `global.temporaryStorage.type: ephemeral` with a StorageClass. Ephemeral creates a paid volume per pod, so get approval first.

**Secrets (manual Helm only).** Keep source files readable only by the operator, outside the repository. Create only the credentials for the selected provider. GCP native authentication replaces the `lakerunner-s3` Secret; see the overlay below.

```bash
kubectl create namespace lakerunner
kubectl -n lakerunner create secret generic lakerunner-license \
  --from-file=license.json=<license-file>
# keys: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
kubectl -n lakerunner create secret generic lakerunner-s3 --from-env-file=<file>
# key: password
kubectl -n lakerunner create secret generic lakerunner-db --from-file=password=<file>
# key: apikeys.yaml
kubectl -n lakerunner create secret generic lakerunner-apikeys --from-file=apikeys.yaml=<file>
```

`apikeys.yaml` looks like this. Generate a UUID for the org and a random key:

```yaml
- organization_id: "<org-uuid>"
  keys:
    - "<random-key>"
```

## 5. Install

### Operator-managed path

Follow https://docs.cardinalhq.io/data-lake/install to create a site, install Perch using that site's generated command, review the deployment and deploy it. Use the site-generated values and Secret references. If the site's UI does not offer the selected external storage/database topology, stop and contact support rather than installing a second release. Then go to verification using the actual release, namespace and endpoints. **Do not run the manual Helm commands below for an operator-managed site.**

### Manual Helm path (POC)

The base values below are for **AWS credentials + S3-compatible storage + HTTP notifications** with an external database and a separately configured collector. They do not provision the cluster, bucket, database, queue, IAM, or collector. Use them as `values.yaml`, then apply exactly one provider overlay if required. Secrets above must already exist.

```yaml
license:
  create: false
  secretName: lakerunner-license
apiKeys:
  source: config
  create: false
  secretName: lakerunner-apikeys
cloudProvider:
  provider: aws   # also for S3-compatible stores
  aws:
    region: <region>
    inject: true
    create: false
    secretName: lakerunner-s3
storageProfiles:
  source: config
  create: true
  yaml:
    - organization_id: <org-uuid>
      instance_num: 1   # unique per collector name within the org
      collector_name: <collector-name, not "default">
      cloud_provider: aws
      region: <region>
      bucket: <bucket>
      endpoint: <https://provider-endpoint>   # omit for AWS
      use_path_style: true
database:
  create: false
  secretName: lakerunner-db
  passwordKey: password
  lrdb:
    host: <host>
    port: <port>
    name: lakerunner
    username: <role>
    sslMode: require
configdb:
  create: false
  secretName: lakerunner-db
  passwordKey: password
  lrdb:
    host: <host>
    port: <port>
    name: configdb
    username: <role>
    sslMode: require
pubsub:
  HTTP:
    enabled: true   # portable S3 route; native providers override this below
    replicas: 2
collector:
  enabled: false
```

#### AWS S3 + SQS overlay

Create a **Standard SQS queue in the bucket's region**, permit the bucket to send messages in its queue policy (scope source bucket ARN and account), then configure `s3:ObjectCreated:*` notifications for `otel-raw/`. Preserve existing bucket notification rules. Follow https://docs.aws.amazon.com/AmazonS3/latest/userguide/ways-to-add-notification-config-to-bucket.html. Give Lakerunner's identity permission to receive/delete messages and get queue attributes, plus storage access and KMS permissions if used. Setting chart values does not configure S3 notifications or IAM.

Save as `provider.yaml`. Keep the base AWS Secret, region and storage profile; remove the custom `endpoint` for AWS S3. For IRSA, configure the chart's ServiceAccount identity/trust policy first, then set `cloudProvider.aws.inject: false`; a kubeconfig login does not give pods AWS credentials. The collector needs its own identity or Secret. Do not also enable gateway HTTP notifications.

```yaml
pubsub:
  HTTP:
    enabled: false
  SQS:
    enabled: true
    queueURL: <sqs-queue-url>
    region: <aws-region>
```

#### Google GCS + Pub/Sub overlay

Create a GCS bucket, Pub/Sub topic and **pull subscription**. Configure `OBJECT_FINALIZE` notifications with `JSON_API_V1` payload, filtered to `otel-raw/`; grant the bucket project's Cloud Storage service agent Pub/Sub Publisher on the topic. Follow https://docs.cloud.google.com/storage/docs/reporting-changes. Give Lakerunner's workload identity Storage Object Admin scoped to the bucket and Pub/Sub Subscriber scoped to the subscription.

Enable and configure Workload Identity Federation for the cluster/node pool and the actual Kubernetes ServiceAccount rendered by the chart: https://docs.cloud.google.com/kubernetes-engine/docs/how-to/workload-identity. `inject: false` only disables Secret injection; it does not grant IAM permissions. Use the principal for that namespace/ServiceAccount, or configure the Google service account impersonation binding and `serviceAccount.annotations` as described there.

Save this as `provider.yaml`. The `storageProfiles.yaml` list **replaces** the base list. Native GCS reads use Google authentication, without an S3 endpoint or AWS Secret.

```yaml
cloudProvider:
  provider: gcp
  gcp:
    create: false
    inject: false
storageProfiles:
  yaml:
    - organization_id: <org-uuid>
      instance_num: 1
      collector_name: <collector-name>
      cloud_provider: gcp
      region: <gcs-region>
      bucket: <gcs-bucket>
pubsub:
  HTTP:
    enabled: false
  GCP:
    enabled: true
    projectID: <gcp-project-id>
    subscriptionID: <pull-subscription-id>
```

**The writer has a separate credential path.** The documented Cardinal gateway uses `awss3`, so for GCS it needs a service-account HMAC key for the XML/S3 API, endpoint `https://storage.googleapis.com`, and bucket upload permissions. See https://docs.cloud.google.com/storage/docs/authentication/hmackeys and https://docs.cardinalhq.io/data-lake/collectors. Store its HMAC access ID/secret in the gateway's AWS credential Secret; do not put them in `cloudProvider.gcp`. A Google JSON key or Workload Identity configuration for Lakerunner does not configure this exporter. Test the writer upload separately. Use native bucket notifications, leaving gateway HTTP notifications off. If policy forbids HMAC keys, select a GCS-capable writer that produces the documented OTLP object layout, or use the portable S3 route; do not assume `awss3` accepts Google OAuth credentials.

#### Render and install

For the portable route, omit `--values provider.yaml` in both commands. Resolve all placeholders first. Inspect the rendered manifests locally without printing Secret contents; Helm dry runs can contain credentials. Confirm the selected notification Deployment, Secret references, pod resources and ServiceAccount before applying.

```bash
CHART_VERSION=4.2.2
helm show values oci://public.ecr.aws/cardinalhq.io/lakerunner --version "$CHART_VERSION" > chart-defaults.yaml
helm template lakerunner oci://public.ecr.aws/cardinalhq.io/lakerunner \
  --version "$CHART_VERSION" --namespace lakerunner \
  --values values.yaml --values provider.yaml > rendered.yaml
helm install lakerunner oci://public.ecr.aws/cardinalhq.io/lakerunner \
  --version "$CHART_VERSION" --namespace lakerunner \
  --values values.yaml --values provider.yaml --wait --timeout 15m
kubectl -n lakerunner get pods
```

A Helm timeout can leave a release and running resources. Inspect `helm status` and pod events before retrying. If setup fails, inspect the setup Job logs and database access first. Record the chart version and both values files for upgrades.

If you enable Grafana, it also needs `grafana.cardinal.apiKey`, and the chart writes that key into a ConfigMap. Tell the operator. Don't commit it.

Deploy and configure the separate collector before verification; `collector.enabled: false` above deliberately does not install it. The collectors must use the same org UUID, bucket, endpoint and collector name. The Cardinal gateway uses its cluster name as the collector name. See https://docs.cardinalhq.io/data-lake/collectors.

## 6. Verify

Do these in order, and report the result of each:

1. All pods are ready, and logs show `License validated`.
2. Send a log with a unique marker and known timestamp through the configured collector; record its service name. Avoid using only an arbitrary bucket upload, which proves storage access but not ingestion.
3. Objects appear under `otel-raw/<org>/<collector>/`.
4. Inspect the selected receiver Deployment: `<release>-pubsub-http`, `<release>-pubsub-sqs` or `<release>-pubsub-gcp`. Confirm it receives the new object and that ingestion advances, using logs and queue/subscription backlog where applicable. For HTTP, look for `Pubsub processing stats`. Do not consume/delete queue messages manually while diagnosing. If no objects are processed, go to troubleshooting.
5. Query that service and time window back and confirm the unique marker appears. A successful HTTP status, an SSE `ok` frame or an empty result is not a pass. For the manual release below, run the port-forward in a separate terminal. For an operator install, use its generated endpoint and authentication. Write the header line `x-cardinalhq-api-key: <key>` to a file only you can read, so the key stays off the command line, and delete the file afterward:

```bash
kubectl -n lakerunner port-forward svc/lakerunner-query-api 8080:8080
curl -N -H @<header-file> -H 'Content-Type: application/json' \
  -H 'Accept: text/event-stream' http://127.0.0.1:8080/api/v1/logs/query \
  --data-raw '{"q":"{service_name=\"<service>\"}","s":"now-1h","e":"now","reverse":true,"limit":5}'
rm <header-file>
```

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `remaining connection slots are reserved` (SQLSTATE 53300), pods crash-looping | Connection limit too low. Raise it or use a bigger plan |
| Helm 403 `authorization token has expired` from public.ecr.aws | Stale login. Run `helm registry logout public.ecr.aws`. Pulls work anonymously |
| Bucket fills, ingest idle, no errors | Notifications aren't arriving. Recheck step 3, including network rules and source ranges |
| Query returns only `{"status":"ok"}` | Wrong field name, wrong org on the API key, or the time window |
| Pending PVCs | No default StorageClass |
| `all_slots_used` (operator trial) | A leftover license claim. Remove it in the site's Deployments tab |

## When you finish

Tell the operator:

- What you created, and where each secret lives.
- The exact upgrade command with release, namespace, pinned chart version and all values files (or the operator-managed upgrade procedure).
- Which verification steps passed.
- What's still open: backups, HA, retention, Ingress, and anything you skipped.
