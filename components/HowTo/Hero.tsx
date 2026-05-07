import styles from './HowTo.module.css';

interface HowToHeroProps {
  badge: string;
  title: string;
  lede: string;
}

export default function HowToHero({ badge, title, lede }: HowToHeroProps) {
  return (
    <div className={styles.standalone}>
      <div className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          {badge}
        </div>
        <h2 className={styles.heroTitle}>{title}</h2>
        <p className={styles.heroSub}>{lede}</p>
      </div>
    </div>
  );
}
