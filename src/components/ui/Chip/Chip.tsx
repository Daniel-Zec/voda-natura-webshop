import type { ReactNode } from 'react';
import styles from './Chip.module.css';

export interface ChipProps {
  href: string;
  children: ReactNode;
  /** sand = on warm backgrounds (default) · neutral = on white */
  tone?: 'sand' | 'neutral';
}

/** Pill-shaped quick link, e.g. popular cartridge codes ("BL 10 – ugljeni blok"). */
export function Chip({ href, children, tone = 'sand' }: ChipProps) {
  return (
    <a href={href} className={[styles.chip, styles[tone]].join(' ')}>
      {children}
    </a>
  );
}
