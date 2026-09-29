import { Icon, type IconName } from '../../ui/Icon/Icon';
import { IconTile } from '../../ui/IconTile/IconTile';
import styles from './TrustBar.module.css';

export interface TrustItem {
  icon: IconName;
  tone: 'natura' | 'water';
  title: string;
  /** Hidden on phones, where the bar becomes a 2 × 2 grid */
  text: string;
  /** Shorter title for phones */
  shortTitle?: string;
}

export interface TrustBarProps {
  items: TrustItem[];
  label?: string;
}

/** The four promises (cash on delivery, 2-year warranty, certificates, phone help). 4 columns on desktop, 2 × 2 on phones. */
export function TrustBar({ items, label = 'Zašto VodaNatura' }: TrustBarProps) {
  return (
    <ul role="list" aria-label={label} className={styles.bar}>
      {items.map((item) => (
        <li key={item.title} className={styles.item}>
          <span className={styles.tileDesktop}>
            <IconTile icon={item.icon} tone={item.tone} />
          </span>
          <span className={[styles.iconMobile, styles[item.tone]].join(' ')}>
            <Icon name={item.icon} size={24} />
          </span>
          <div>
            <p className={[styles.title, item.shortTitle ? styles.hasShort : ''].join(' ')}>
              <span className={styles.titleFull}>{item.title}</span>
              {item.shortTitle && <span className={styles.titleShort}>{item.shortTitle}</span>}
            </p>
            <p className={styles.text}>{item.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
