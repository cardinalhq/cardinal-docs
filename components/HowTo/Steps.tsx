import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import styles from './HowTo.module.css';

interface StepProps {
  title: ReactNode;
  children?: ReactNode;
  /** Injected by <Steps>. Don't set manually. */
  _number?: number;
  /** Injected by <Steps>. Don't set manually. */
  _isLast?: boolean;
  /** Injected by <Steps>. Don't set manually. */
  _delay?: number;
}

export function Step({ title, children, _number = 1, _isLast = false, _delay = 0 }: StepProps) {
  return (
    <div className={styles.step} style={{ animationDelay: `${_delay}ms` }}>
      <div className={styles.stepRail}>
        <div className={styles.stepNumber}>{_number}</div>
        {!_isLast && <div className={styles.stepLine} />}
      </div>
      <div className={styles.stepBody}>
        <h3 className={styles.stepTitle}>{title}</h3>
        <div className={styles.stepContent}>{children}</div>
      </div>
    </div>
  );
}

interface StepsProps {
  children?: ReactNode;
}

export function Steps({ children }: StepsProps) {
  const stepChildren = Children.toArray(children).filter(
    (c): c is ReactElement<StepProps> => isValidElement(c) && c.type === Step,
  );
  const total = stepChildren.length;
  return (
    <div className={styles.standalone}>
      <div className={styles.timeline}>
        {stepChildren.map((child, i) =>
          cloneElement(child, {
            _number: i + 1,
            _isLast: i === total - 1,
            _delay: i * 80,
          }),
        )}
      </div>
    </div>
  );
}
