---
name: install-cardinal-data-lake
description: Install Cardinal Data Lake (Lakerunner) on any Kubernetes cluster, including managed Kubernetes with S3-compatible object storage and externally managed PostgreSQL. Use when asked to deploy, install or size Lakerunner or Cardinal Data Lake.
---

# Install Cardinal Data Lake

Last checked against chart 4.2.2 (Lakerunner v1.98.1).

How far this guide has been tested, which you should tell the operator before you start:

- Values, secrets, Postgres connection numbers and troubleshooting: tested on a self-hosted cluster.
- Collector gateway `notifications`: checked against the exporter source, not retested end to end for this guide.
- Managed Kubernetes, VPS object storage and managed PostgreSQL: **not run yet**. Expect to find problems, and report them to support@cardinalhq.io.

## Rules

- Find out before you ask. Use what you already know about this operator's infrastructure, plus their kubeconfig, cloud CLI and infrastructure code. State what you found in one line and ask them to confirm it. Only ask what you can't find out.
- Ask one decision at a time. Put your recommendation first and give the reason.
- Never print secrets, commit them, or put them on a command line. Create Kubernetes Secrets from files and refer to them by name.
- Get approval before anything that costs money, exposes a service, or deletes data.
- The chart wins over this guide. Before writing values, run `helm show values oci://public.ecr.aws/cardinalhq.io/lakerunner`.
- You are not done until you have queried a record back.

## 1. Discover

Run these and keep the results:

```bash
kubectl config current-context
kubectl version
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

Confirm the kubecontext with the operator before making any change.

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

Assume a VPS provider's object storage has no bucket events unless its docs say otherwise. Check with:

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

**Bucket.** Create it and a key scoped to that bucket. Set `endpoint` in the storage profile. The chart README says `use_path_style` should be `true`; if the provider only supports virtual-hosted URLs, test an upload and read before installing. Use the region name the provider expects.

**PostgreSQL.**

- Version 16 or later, with two databases such as `lakerunner` and `configdb`. One role owning both works.
- Allow the cluster's private network, or its egress IPs, and use `sslMode: require`. Stricter modes aren't covered here.
- **Connections matter.** A minimum-replica install held 66 to 98 while idle, and scale-up adds more. Plan for at least 200. Where the limit depends on the plan, this decides the plan, so read the limit from the provider's current plan table. For example, DigitalOcean listed 197 backend connections for 8 GiB in October 2026, and new Standard Edition clusters there can't use plans above 4 GiB.
- Migrations need a direct connection, because advisory locks don't work through PgBouncer. If the app uses a pooler, point `setup.database.lrdb` and `setup.configdb.lrdb` at the direct address. Start with direct connections everywhere if the limit allows it.
- Only the built-in `plpgsql` extension was present after setup.

**Compute.** Minimum-replica requests are about 16.1 vCPU and 29.3 GiB, plus system overhead and about 0.2 vCPU and 0.3 GiB more with Grafana. Each worker role can scale to 10 replicas, so set a lower `process.logs.autoscaling.maxReplicas`, and the same for `process.metrics` and `process.traces`, on small clusters. Check whether the budget can absorb that.

**Scratch disk.** The query worker defaults to a 100Gi `emptyDir` limit. Compare that with node disk. Either lower `queryWorker.temporaryStorage.size`, or set `global.temporaryStorage.type: ephemeral` with a StorageClass. Ephemeral creates a paid volume per pod, so get approval first.

**Secrets.**

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
    enabled: true   # or the SQS or GCP block from step 3
    replicas: 2
collector:
  enabled: false
```

```bash
helm install lakerunner oci://public.ecr.aws/cardinalhq.io/lakerunner \
  --namespace lakerunner --values values.yaml
kubectl -n lakerunner get pods -w
```

If you enable Grafana, it also needs `grafana.cardinal.apiKey`, and the chart writes that key into a ConfigMap. Tell the operator. Don't commit it.

The collectors must use the same org UUID, bucket, endpoint and collector name. The Cardinal gateway uses its cluster name as the collector name. See https://docs.cardinalhq.io/data-lake/collectors.

## 6. Verify

Do these in order, and report the result of each:

1. All pods are ready, and logs show `License validated`.
2. Send real telemetry, or use the OTel demo.
3. Objects appear under `otel-raw/<org>/<collector>/`.
4. `pubsub-http` logs show `Pubsub processing stats`. If not, go to troubleshooting.
5. Query the record back. Write the header line `x-cardinalhq-api-key: <key>` to a file only you can read, so the key stays off the command line, and delete the file afterward:

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
- The exact upgrade command.
- Which verification steps passed.
- What's still open: backups, HA, retention, Ingress, and anything you skipped.
