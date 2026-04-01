import styles from "./Diagram.module.css";
import DiagramNode from "./DiagramNode";
import DiagramArrow from "./DiagramArrow";

export default function IngestionFlowDiagram() {
  return (
    <div className={styles.diagram}>
      <DiagramNode
        type="storage"
        title="S3 / GCS / Azure Blob"
        lines={["raw prefixes:", "otel-raw/logs/ metrics/ traces/"]}
      />
      <DiagramArrow label="object-created notifications" />
      <DiagramNode
        type="gateway"
        title="PubSub Adapters"
        lines={["SQS / GCP / Azure / HTTP"]}
      />
      <DiagramArrow />
      <DiagramNode
        type="worker"
        title="process-{logs,metrics,traces}"
        wide
        lines={[
          "reads raw objects → normalizes telemetry",
          "writes Parquet segments → registers in lrdb",
          "compacts small segments into larger ones",
          "produces time-aggregated rollups (metrics)",
        ]}
      />
      <DiagramArrow label="reads & writes" />

      <div className={styles.splitRow}>
        <DiagramNode
          type="storage"
          title="S3 / GCS / Azure Blob"
          lines={[
            "db/{org}/{collector}/",
            "{date}/{dataset}/{hour}/",
            "tbl_{segment_id}.parquet",
          ]}
        />
        <div className={styles.splitConnector}>
          <DiagramArrow direction="right" />
        </div>
        <DiagramNode
          type="database"
          title="PostgreSQL (lrdb)"
          lines={["segment metadata:", "time bounds, org, instance, frequency"]}
        />
      </div>
    </div>
  );
}
