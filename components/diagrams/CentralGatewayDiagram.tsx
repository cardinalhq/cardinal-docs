import styles from "./Diagram.module.css";
import DiagramNode from "./DiagramNode";
import DiagramArrow from "./DiagramArrow";

export default function CentralGatewayDiagram() {
  return (
    <div className={styles.diagram}>
      <div className={styles.parallelPaths}>
        <div className={styles.parallelPath}>
          <DiagramNode type="client" title="Org A Agents" lines={["header: org-a"]} />
          <DiagramArrow />
        </div>
        <div className={styles.parallelPath}>
          <DiagramNode type="client" title="Org B Agents" lines={["header: org-b"]} />
          <DiagramArrow />
        </div>
        <div className={styles.parallelPath}>
          <DiagramNode type="client" title="Org C Agents" lines={["header: org-c"]} />
          <DiagramArrow />
        </div>
      </div>

      <DiagramNode
        type="gateway"
        title="Central OTEL Collector Gateway"
        wide
        lines={[
          "reads org ID from header",
          "routes data to correct prefix",
        ]}
      />
      <DiagramArrow />
      <DiagramNode
        type="storage"
        title="S3 / Object Storage"
        wide
        lines={["org-a/otel-raw/...   org-b/otel-raw/...   org-c/otel-raw/..."]}
      />
      <DiagramArrow />
      <DiagramNode
        type="worker"
        title="Lakerunner"
        lines={[
          "ingestion / compaction / rollup / query",
          "prefix-level parallelism",
          "automatic multi-tenancy",
        ]}
      />
    </div>
  );
}
