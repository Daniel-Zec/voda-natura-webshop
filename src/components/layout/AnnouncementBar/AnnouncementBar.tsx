import { Icon, type IconName } from '../../ui/Icon/Icon';
import styles from './AnnouncementBar.module.css';

export interface AnnouncementItem {
  icon: IconName;
  text: string;
}

export interface AnnouncementBarProps {
  /** The first item is the only one shown on phones. */
  items: AnnouncementItem[];
}

/** Green strip above the header with the key promises (cash on delivery first). */
export function AnnouncementBar({ items }: AnnouncementBarProps) {
  return (
    <div className={styles.bar}>
      <ul role="list" className={styles.list}>
        {items.map((item) => (
          <li key={item.text} className={styles.item}>
            <Icon name={item.icon} size={18} />
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
