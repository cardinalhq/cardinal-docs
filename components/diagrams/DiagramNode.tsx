import styles from "./Diagram.module.css";

type NodeType = "storage" | "kafka" | "worker" | "client" | "gateway" | "database";

const typeClassMap: Record<NodeType, string> = {
  storage: styles.nodeStorage,
  kafka: styles.nodeKafka,
  worker: styles.nodeWorker,
  client: styles.nodeClient,
  gateway: styles.nodeGateway,
  database: styles.nodeDatabase,
};

interface DiagramNodeProps {
  type: NodeType;
  title: string;
  lines?: string[];
  wide?: boolean;
}

export default function DiagramNode({ type, title, lines, wide }: DiagramNodeProps) {
  return (
    <div className={`${styles.node} ${typeClassMap[type]} ${wide ? styles.nodeWide : ""}`}>
      <div className={styles.nodeTitle}>{title}</div>
      {lines?.map((line, i) => (
        <div key={i} className={styles.nodeLine}>{line}</div>
      ))}
    </div>
  );
}
