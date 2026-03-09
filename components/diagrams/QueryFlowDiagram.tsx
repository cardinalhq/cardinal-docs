import styles from "./Diagram.module.css";
import DiagramNode from "./DiagramNode";
import DiagramArrow from "./DiagramArrow";

export default function QueryFlowDiagram() {
  return (
    <div className={styles.diagram}>
      <DiagramNode
        type="client"
        title="Client: Grafana / API / CLI"
      />
      <DiagramArrow label="LakeQL or PromQL / LogQL query" />

      {/* query-api row: main node + arrow + PostgreSQL */}
      <div className={styles.gridRow}>
        <div className={styles.gridMain}>
          <DiagramNode
            type="gateway"
            title="query-api"
            lines={[
              "Parse query + build execution plan",
              "Fan out to workers, merge results",
              "Stream final result via SSE",
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
            lines={["segment index"]}
          />
        </div>
      </div>

      <DiagramArrow label="fan out work units" />

      {/* workers row: main node + arrow + S3 */}
      <div className={styles.gridRow}>
        <div className={styles.gridMain}>
          <DiagramNode
            type="worker"
            title="N query-workers"
            lines={["Aggregations on Parquet", "in Object Storage"]}
          />
        </div>
        <div className={styles.gridConnector}>
          <DiagramArrow direction="right" label="read parquet" />
        </div>
        <div className={styles.gridSide}>
          <DiagramNode
            type="storage"
            title="S3 / GCS / Azure Blob"
            lines={["parquet segments"]}
          />
        </div>
      </div>

      <DiagramArrow label="partial results merge + SSE stream" />
      <DiagramNode
        type="client"
        title="Client: Grafana / API / CLI"
      />
    </div>
  );
}
