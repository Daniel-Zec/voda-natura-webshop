import type { CategorySummary } from '../../../data/types';
import styles from './CategoryCard.module.css';

export interface CategoryCardProps {
  category: CategorySummary;
  href: string;
  /** Hide the description line (phone grid shows the name only) */
  compact?: boolean;
  /** On phones show as a full-width row with a small image and an arrow (last tile of an odd grid) */
  wideOnMobile?: boolean;
}

/** Category tile: product photo on a muted background, name and the problem it solves. */
export function CategoryCard({ category, href, compact = false, wideOnMobile = false }: CategoryCardProps) {
  return (
    <a href={href} className={[styles.card, compact ? styles.compact : '', wideOnMobile ? styles.wide : ''].join(' ')}>
      <span className={styles.media}>
        <img src={category.image.src} alt={category.image.alt} loading="lazy" decoding="async" width={320} height={320} />
      </span>
      <span className={styles.body}>
        <span className={styles.name}>{category.name}</span>
        <span className={styles.description}>{category.description}</span>
      </span>
      {wideOnMobile && (
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
      )}
    </a>
  );
}
