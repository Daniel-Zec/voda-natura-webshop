import type { ReactNode } from 'react';
import type { IconName } from '../../ui/Icon/Icon';
import { IconTile } from '../../ui/IconTile/IconTile';
import { ArrowLink } from '../../ui/ArrowLink/ArrowLink';
import styles from './InfoCard.module.css';

export interface InfoCardProps {
  icon: IconName;
  tone?: 'info' | 'brand';
  title: string;
  children: ReactNode;
  link?: { href: string; label: string };
}

/** Bordered card with an icon, heading, text and a link (installation, water analysis). */
export function InfoCard({ icon, tone = 'info', title, children, link }: InfoCardProps) {
  return (
    <div className={styles.card}>
      <IconTile icon={icon} tone={tone} size="lg" />
      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.text}>{children}</div>
        {link && <ArrowLink href={link.href}>{link.label}</ArrowLink>}
      </div>
    </div>
  );
}
