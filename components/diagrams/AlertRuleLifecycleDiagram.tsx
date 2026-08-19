import styles from "./Diagram.module.css";
import DiagramNode from "./DiagramNode";
import DiagramArrow from "./DiagramArrow";

export default function AlertRuleLifecycleDiagram() {
  return (
    <div className={styles.diagram} role="img" aria-label="Alert lifecycle from query evaluation to firing notification and automatic resolution">
      <DiagramNode
        type="storage"
        title="Signal query"
        lines={["metrics or logs", "evaluated on a regular cadence"]}
      />
      <DiagramArrow label="query results" />
      <DiagramNode
        type="worker"
        title="Detection"
        lines={["threshold, anomaly, or exceptions", "tracked independently per group key"]}
      />
      <DiagramArrow label="condition sustained for For duration" />
      <DiagramNode
        type="gateway"
        title="Trigger opens"
        lines={["one firing event", "one notification per destination"]}
      />
      <DiagramArrow label="continued firing stays silent" />
      <DiagramNode
        type="kafka"
        title="Quiet-time clock"
        lines={["each new firing resets the clock", "brief lulls keep the trigger open"]}
      />
      <DiagramArrow label="full suppression window without firing" />
      <DiagramNode
        type="client"
        title="Trigger resolves"
        lines={["one resolved event", "next firing opens a new trigger"]}
      />
    </div>
  );
}
