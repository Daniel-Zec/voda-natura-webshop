import { Icon } from '../../ui/Icon/Icon';
import { Overline } from '../../ui/Overline/Overline';
import styles from './GuideCard.module.css';

export interface GuideSummary {
  title: string;
  description: string;
  href: string;
  /** Short topic label ("Ukus i hlor") */
  topic: string;
  /** Reading time in minutes */
  minutes: number;
  image: { src: string; alt: string };
}

export interface GuideCardProps {
  guide: GuideSummary;
  /** "featured": large two-column card on a warm background, for the top guide */
  variant?: 'default' | 'featured';
  /** Heading level for the title (h2 on the guides page for the featured card, h3 in grids) */
  headingLevel?: 2 | 3;
}

/**
 * Card for a "Saveti o vodi" guide: image, topic, reading time, title and description.
 * The whole card is one link; the image is decorative because the title says it all.
 */
export function GuideCard({ guide, variant = 'default', headingLevel = 3 }: GuideCardProps) {
  const Heading = `h${headingLevel}` as const;
  const featured = variant === 'featured';
  return (
    <a href={guide.href} className={[styles.card, featured && styles.featured].filter(Boolean).join(' ')}>
      <span className={styles.media}>
        <img src={guide.image.src} alt="" loading={featured ? 'eager' : 'lazy'} decoding="async" width={1600} height={900} />
      </span>
      <span className={styles.body}>
        <span className={styles.meta}>
          <Overline as="span">{featured ? `Izdvojeno · ${guide.topic}` : guide.topic}</Overline>
          <span className={styles.time}>
            <Icon name="clock" size={16} />
            {guide.minutes} min čitanja
          </span>
        </span>
        <Heading className={styles.title}>{guide.title}</Heading>
        <span className={styles.description}>{guide.description}</span>
        {featured && (
          <span className={styles.more}>
            Pročitajte vodič <Icon name="arrowRight" size={18} />
          </span>
        )}
      </span>
    </a>
  );
}
