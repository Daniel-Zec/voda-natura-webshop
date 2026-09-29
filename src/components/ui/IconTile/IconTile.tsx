import { Icon, type IconName } from '../Icon/Icon';
import styles from './IconTile.module.css';

export interface IconTileProps {
  icon: IconName;
  /** natura = green (payment, guarantee) · water = blue (certificates, help) · brand = dark blue line icon on blue */
  tone?: 'natura' | 'water' | 'info' | 'brand';
  /** md = 48 px tile · lg = 56 px tile */
  size?: 'md' | 'lg';
}

/** Rounded square with a line icon, used in the trust bar and info cards. */
export function IconTile({ icon, tone = 'natura', size = 'md' }: IconTileProps) {
  return (
    <span className={[styles.tile, styles[tone], styles[size]].join(' ')} aria-hidden="true">
      <Icon name={icon} size={size === 'lg' ? 28 : 26} />
    </span>
  );
}
