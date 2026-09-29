import type { ReactNode } from 'react';
import { ArrowLink } from '../ArrowLink/ArrowLink';
import { Overline, type OverlineTone } from '../Overline/Overline';
import styles from './SectionHeader.module.css';

export interface SectionHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  overline?: string;
  overlineTone?: OverlineTone;
  /** "Svi proizvodi →" link on the right (below on mobile) */
  link?: { href: string; label: string };
  align?: 'left' | 'center';
  /** Heading level. Sections use h2 (one h1 per page). */
  level?: 2 | 3;
  /** Larger H1-size section title, as in the savings band */
  large?: boolean;
  id?: string;
}

/** Section title block: optional overline, H2 title, subtitle and a "see all" link. */
export function SectionHeader({
  title,
  subtitle,
  overline,
  overlineTone,
  link,
  align = 'left',
  level = 2,
  large = false,
  id,
}: SectionHeaderProps) {
  const Heading = level === 2 ? 'h2' : 'h3';
  return (
    <div className={[styles.header, styles[align]].join(' ')}>
      <div className={styles.text}>
        {overline && <Overline tone={overlineTone}>{overline}</Overline>}
        <Heading id={id} className={large ? styles.titleLarge : styles.title}>
          {title}
        </Heading>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {link && (
        <div className={styles.link}>
          <ArrowLink href={link.href}>{link.label}</ArrowLink>
        </div>
      )}
    </div>
  );
}
