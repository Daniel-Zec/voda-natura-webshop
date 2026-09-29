import { Button } from '../../ui/Button/Button';
import { Icon } from '../../ui/Icon/Icon';
import styles from './Hero.module.css';

export interface HeroProps {
  /** Keyword line; rendered inside the H1 so the page heading carries the search term (SEO guide). */
  overline: string;
  /** Shorter overline for phones */
  overlineShort?: string;
  title: string;
  lead: string;
  leadShort?: string;
  image: { srcSet: string; src: string; alt: string };
  primary: { href: string; label: string; note?: string };
  secondary: { href: string; label: string };
  /** Check-mark promises under the buttons (desktop) */
  promises?: string[];
}

/**
 * Homepage hero. Desktop: photo with a white fade and text on the left.
 * Phone: photo on top, text card below (as in the mobile mock-up).
 */
export function Hero({ overline, overlineShort, title, lead, leadShort, image, primary, secondary, promises = [] }: HeroProps) {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.frame}>
        <img
          className={styles.image}
          src={image.src}
          srcSet={image.srcSet}
          sizes="(min-width: 1280px) 1200px, 100vw"
          alt={image.alt}
          width={1680}
          height={944}
          fetchPriority="high"
          decoding="async"
        />
        <div className={styles.fade} aria-hidden="true" />
        <div className={styles.content}>
          <h1 id="hero-title" className={styles.heading}>
            <span className={styles.overline}>
              <span className={overlineShort ? styles.desktopOnly : undefined}>{overline}</span>
              {overlineShort && <span className={styles.mobileOnly}>{overlineShort}</span>}
            </span>
            <span className={styles.title}>{title}</span>
          </h1>
          <p className={styles.lead}>
            <span className={leadShort ? styles.desktopOnly : undefined}>{lead}</span>
            {leadShort && <span className={styles.mobileOnly}>{leadShort}</span>}
          </p>
          <div className={styles.actions}>
            <Button href={primary.href} variant="secondary" size="lg" className={styles.action}>
              {primary.label}
              {primary.note && <span className={styles.note}>· {primary.note}</span>}
            </Button>
            <Button href={secondary.href} variant="outline" size="lg" className={styles.action}>
              {secondary.label}
            </Button>
          </div>
          {promises.length > 0 && (
            <ul role="list" className={styles.promises}>
              {promises.map((p) => (
                <li key={p}>
                  <Icon name="check" size={18} strokeWidth={2.4} />
                  {p}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
