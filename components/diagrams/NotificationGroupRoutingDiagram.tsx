import styles from "./Diagram.module.css";
import DiagramNode from "./DiagramNode";
import DiagramArrow from "./DiagramArrow";

export default function NotificationGroupRoutingDiagram() {
  return (
    <div className={styles.diagram} role="img" aria-label="An alert rule sending firing and resolved events through a notification group to multiple destinations">
      <DiagramNode
        type="worker"
        title="Alert rule"
        lines={["Checkout errors", "emits firing + resolved events"]}
      />
      <DiagramArrow label="select one group" />
      <DiagramNode
        type="gateway"
        title="Notification group"
        lines={["On-call platform", "reusable fan-out bundle"]}
      />
      <DiagramArrow label="independent delivery per destination" />
      <DiagramNode
        type="client"
        title="Destinations"
        lines={["Slack #platform-oncall", "Email oncall@example.com", "Incident webhook"]}
        wide
      />
    </div>
  );
}
