import type { ElementType, ReactNode } from 'react';
import styles from './Overline.module.css';

export type OverlineTone = 'brand' | 'info' | 'sand' | 'muted';

export interface OverlineProps {
  tone?: OverlineTone;
  /** Render as another element, e.g. 'span' inside a heading. */
  as?: ElementType;
  children: ReactNode;
  className?: string;
}

/** Uppercase 11 px label above a heading ("FLAŠIRANA VODA VS. FILTER"). Typography style: Overline. */
export function Overline({ tone = 'brand', as: Tag = 'p', children, className }: OverlineProps) {
  return <Tag className={[styles.overline, styles[tone], className].filter(Boolean).join(' ')}>{children}</Tag>;
}
