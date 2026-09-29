import type { ReactNode } from 'react';
import styles from './Badge.module.css';

export type BadgeTone = 'info' | 'natura' | 'sand' | 'success' | 'warning' | 'neutral';

export interface BadgeProps {
  /** info = blue (recommendation) · natura = logo green (best value) · sand = warm (audience) · success / warning = status */
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

/** Small rounded label on product images and cards, e.g. "Najbolje za piće". */
export function Badge({ tone = 'info', children, className }: BadgeProps) {
  return <span className={[styles.badge, styles[tone], className].filter(Boolean).join(' ')}>{children}</span>;
}
