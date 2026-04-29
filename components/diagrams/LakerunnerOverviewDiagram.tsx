import styles from "./Diagram.module.css";
import DiagramNode from "./DiagramNode";
import DiagramArrow from "./DiagramArrow";

export default function LakerunnerOverviewDiagram() {
  return (
    <div className={styles.diagram}>
      {/* ── Ingest path ───────────────────────────────── */}
      <div className={styles.divider}>
        <span className={styles.dividerLabel}>ingest</span>
      </div>

      <DiagramNode
        type="client"
        title="Collectors / Agents"
        lines={["OpenTelemetry, vendor exporters"]}
      />
      <DiagramArrow label="OTel logs / metrics / traces" />

      <DiagramNode
        type="storage"
        title="Object Storage — raw"
        lines={["otel-raw/{logs,metrics,traces}/"]}
      />
      <DiagramArrow label="object-created notifications" />

      <DiagramNode
        type="gateway"
        title="PubSub Adapter"
        lines={["SQS / GCP Pub/Sub / Azure Event Grid / HTTP"]}
      />
      <DiagramArrow />

      <DiagramNode
        type="worker"
        title="process-{logs,metrics,traces}"
        wide
        lines={[
          "normalize raw telemetry → Parquet",
          "compact small segments into larger ones",
          "produce time-aggregated rollups (metrics)",
        ]}
      />
      <DiagramArrow label="writes & registers" />

      {/* Shared state: cooked Parquet + segment index */}
      <div className={styles.splitRow}>
        <DiagramNode
          type="storage"
          title="Object Storage — cooked"
          lines={[
            "db/{org}/{collector}/",
            "tbl_{segment_id}.parquet",
          ]}
        />
        <div className={styles.splitConnector}>
          <DiagramArrow direction="right" />
        </div>
        <DiagramNode
          type="database"
          title="PostgreSQL (lrdb)"
          lines={["segment metadata index"]}
        />
      </div>

      {/* ── Query path ────────────────────────────────── */}
      <div className={styles.divider}>
        <span className={styles.dividerLabel}>query</span>
      </div>

      <DiagramNode
        type="client"
        title="Grafana / API / CLI"
      />
      <DiagramArrow label="LakeQL or PromQL / LogQL" />

      <div className={styles.gridRow}>
        <div className={styles.gridMain}>
          <DiagramNode
            type="gateway"
            title="query-api"
            lines={[
              "parse + plan",
              "fan out, merge, stream via SSE",
            ]}
          />
        </div>
        <div className={styles.gridConnector}>
          <DiagramArrow direction="right" label="segment lookup" />
        </div>
        <div className={styles.gridSide}>
          <DiagramNode
            type="database"
            title="PostgreSQL (lrdb)"
            lines={["segment metadata index"]}
          />
        </div>
      </div>

      <DiagramArrow label="fan out work units" />

      <div className={styles.gridRow}>
        <div className={styles.gridMain}>
          <DiagramNode
            type="worker"
            title="N query-workers"
            lines={["DuckDB on Parquet", "stateless, scale horizontally"]}
          />
        </div>
        <div className={styles.gridConnector}>
          <DiagramArrow direction="right" label="read parquet" />
        </div>
        <div className={styles.gridSide}>
          <DiagramNode
            type="storage"
            title="Object Storage — cooked"
            lines={["parquet segments"]}
          />
        </div>
      </div>

      <DiagramArrow label="partial results merged + streamed via SSE" />

      <DiagramNode
        type="client"
        title="Grafana / API / CLI"
      />
    </div>
  );
}
