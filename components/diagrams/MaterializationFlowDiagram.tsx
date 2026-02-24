import styles from "./Diagram.module.css";
import DiagramNode from "./DiagramNode";
import DiagramArrow from "./DiagramArrow";

export default function MaterializationFlowDiagram() {
  return (
    <div className={styles.diagram}>
      {/* Ingest-time: two inputs feed into ingest workers */}
      <div className={styles.row}>
        <div className={styles.column}>
          <DiagramNode
            type="storage"
            title="Raw Telemetry"
            lines={["logs / metrics / traces"]}
          />
          <DiagramArrow />
        </div>
        <div className={styles.column}>
          <DiagramNode
            type="database"
            title="Expression Catalog"
            lines={["materialization rules"]}
          />
          <DiagramArrow />
        </div>
      </div>

      <DiagramNode
        type="worker"
        title="Ingest Workers"
        wide
        lines={[
          "evaluate rules against incoming data",
          "emit materialized metric rows (10s buckets)",
        ]}
      />
      <DiagramArrow />
      <DiagramNode
        type="storage"
        title="Materialized Metric Segments"
        lines={["normal metrics format in object storage"]}
      />
      <DiagramArrow />
      <DiagramNode
        type="worker"
        title="Compaction + Rollup Pipeline"
        lines={["same pipeline as all other metrics"]}
      />

      {/* Divider */}
      <div className={styles.divider}>
        <span className={styles.dividerLabel}>query time</span>
      </div>

      <DiagramNode
        type="client"
        title="Query Arrives"
        lines={["dashboard / alert / API"]}
      />
      <DiagramArrow />
      <DiagramNode
        type="gateway"
        title="query-api"
        wide
        lines={[
          "analyze expression tree",
          "identify rewritable sub-expressions",
          "check materialization guards",
        ]}
      />
      <DiagramArrow />

      {/* Branch: materialized vs raw */}
      <div className={styles.row}>
        <div className={styles.column}>
          <DiagramNode
            type="storage"
            title="Materialized Segments"
            lines={["fast: precomputed results"]}
          />
        </div>
        <div className={styles.column}>
          <DiagramNode
            type="storage"
            title="Raw Segments"
            lines={["fallback: full scan"]}
          />
        </div>
      </div>

      <DiagramArrow />
      <DiagramNode
        type="gateway"
        title="Evaluator"
        lines={["merge + stream response via SSE"]}
      />
    </div>
  );
}
