import styles from "./Diagram.module.css";

interface DiagramArrowProps {
  label?: string;
  direction?: "down" | "right";
  length?: number;
}

export default function DiagramArrow({ label, direction = "down", length }: DiagramArrowProps) {
  if (direction === "right") {
    return (
      <div className={styles.arrowHorizontal}>
        <div className={styles.arrowLineHorizontal} style={length ? { width: length } : undefined} />
        <div className={styles.arrowHeadRight} />
        {label && <span className={styles.arrowLabelHorizontal}>{label}</span>}
      </div>
    );
  }

  return (
    <div className={styles.arrow}>
      <div className={styles.arrowLine} style={length ? { minHeight: length } : undefined} />
      <div className={styles.arrowHead} />
      {label && <span className={styles.arrowLabel}>{label}</span>}
    </div>
  );
}
