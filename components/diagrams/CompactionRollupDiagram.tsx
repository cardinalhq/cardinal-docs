import styles from "./Diagram.module.css";
import DiagramNode from "./DiagramNode";
import DiagramArrow from "./DiagramArrow";

function CompactionColumn() {
  return (
    <div className={styles.sideColumn}>
      <div className={styles.nodeLine} style={{ marginBottom: 8, fontWeight: 600, fontSize: "0.85rem", color: "#4b5563" }}>
        Compaction
      </div>
      <DiagramNode
        type="kafka"
        title="Kafka"
        lines={["boxer.{signal}.compact"]}
      />
      <DiagramArrow />
      <DiagramNode
        type="worker"
        title="boxer-compact-{signal}"
        lines={["groups segments for merge"]}
      />
      <DiagramArrow />
      <DiagramNode
        type="kafka"
        title="Kafka"
        lines={["segments.{signal}.compact"]}
      />
      <DiagramArrow />
      <DiagramNode
        type="worker"
        title="compact-{signal} worker"
        lines={[
          "reads input segments",
          "writes merged segment",
          "updates segment index",
        ]}
      />
    </div>
  );
}

function RollupColumn() {
  return (
    <div className={styles.sideColumn}>
      <div className={styles.nodeLine} style={{ marginBottom: 8, fontWeight: 600, fontSize: "0.85rem", color: "#4b5563" }}>
        Rollup (metrics only)
      </div>
      <DiagramNode
        type="kafka"
        title="Kafka"
        lines={["boxer.metrics.rollup"]}
      />
      <DiagramArrow />
      <DiagramNode
        type="worker"
        title="boxer-rollup-metrics"
      />
      <DiagramArrow />
      <DiagramNode
        type="kafka"
        title="Kafka"
        lines={["segments.metrics.rollup"]}
      />
      <DiagramArrow />
      <DiagramNode
        type="worker"
        title="rollup-metrics worker"
        lines={[
          "reads lower-res tier",
          "writes higher-res tier",
          "updates segment index",
        ]}
      />
    </div>
  );
}

export default function CompactionRollupDiagram() {
  return (
    <div className={styles.diagram}>
      <div className={styles.row}>
        <CompactionColumn />
        <RollupColumn />
      </div>
    </div>
  );
}
