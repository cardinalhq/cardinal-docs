import styles from "./Diagram.module.css";
import DiagramNode from "./DiagramNode";
import DiagramArrow from "./DiagramArrow";

function OrgPath({ org, prefix }: { org: string; prefix: string }) {
  return (
    <div className={styles.parallelPath}>
      <DiagramNode type="client" title={`${org} Agents`} />
      <DiagramArrow />
      <DiagramNode
        type="gateway"
        title="OTEL Collector"
        lines={[`(${org})`, `prefix: ${prefix}/`]}
      />
      <DiagramArrow />
    </div>
  );
}

export default function PerOrgCollectorDiagram() {
  return (
    <div className={styles.diagram}>
      <div className={styles.parallelPaths}>
        <OrgPath org="Org A" prefix="org-a" />
        <OrgPath org="Org B" prefix="org-b" />
        <OrgPath org="Org C" prefix="org-c" />
      </div>

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
