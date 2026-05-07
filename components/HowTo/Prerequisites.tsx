import type { ReactNode } from 'react';
import styles from './HowTo.module.css';

export interface PrerequisiteItem {
  icon: ReactNode;
  title: ReactNode;
  alt?: ReactNode;
}

interface PrerequisitesProps {
  items: PrerequisiteItem[];
  title?: string;
}

export default function Prerequisites({ items, title = 'Prerequisites' }: PrerequisitesProps) {
  return (
    <div className={styles.standalone}>
      <div className={styles.prereqs}>
        <h3 className={styles.prereqTitle}>{title}</h3>
        <div className={styles.prereqGrid}>
          {items.map((item, i) => (
            <div key={i} className={styles.prereqItem}>
              <span className={styles.prereqIcon}>{item.icon}</span>
              <div>
                <strong>{item.title}</strong>
                {item.alt ? <span className={styles.prereqAlt}>{item.alt}</span> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
