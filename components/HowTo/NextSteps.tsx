import type { ReactNode } from 'react';
import styles from './HowTo.module.css';

export interface NextStepItem {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
  href: string;
}

interface NextStepsProps {
  items: NextStepItem[];
  title?: string;
}

export default function NextSteps({ items, title = "What's next?" }: NextStepsProps) {
  return (
    <div className={styles.standalone}>
      <div className={styles.nextSection}>
        <h3 className={styles.nextTitle}>{title}</h3>
        <div className={styles.nextGrid}>
          {items.map((item) => (
            <a key={item.href} href={item.href} className={styles.nextCard}>
              <span className={styles.nextIcon}>{item.icon}</span>
              <div>
                <div className={styles.nextCardTitle}>{item.title}</div>
                <div className={styles.nextCardDesc}>{item.description}</div>
              </div>
              <svg
                className={styles.nextArrow}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
