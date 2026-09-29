import type { ReactNode } from 'react';
import styles from './ArrowLink.module.css';

export interface ArrowLinkProps {
  href: string;
  children: ReactNode;
  /** Put the link on a light line of its own on mobile */
  className?: string;
}

/** Text link with a trailing arrow: "Svi sistemi →". Link colour token, 16 px SemiBold. */
export function ArrowLink({ href, children, className }: ArrowLinkProps) {
  return (
    <a href={href} className={[styles.link, className].filter(Boolean).join(' ')}>
      {children}
      <span aria-hidden="true" className={styles.arrow}>
        →
      </span>
    </a>
  );
}
