import { formatNumber } from '../../../lib/format';
import styles from './Price.module.css';

export interface PriceProps {
  /** Price in whole dinars, VAT included. */
  amount: number;
  /** sm = 20 px (cartridge tiles, mobile cards) · md = 24 px (product cards) · lg = Price style 24/28 px (product page) */
  size?: 'sm' | 'md' | 'lg';
  /** Show "RSD" smaller after the number (default) */
  currency?: boolean;
  /** Use brand green (product page) */
  brand?: boolean;
}

/** Price with VAT, formatted "56.899 RSD". All shop prices include VAT. */
export function Price({ amount, size = 'md', currency = true, brand = false }: PriceProps) {
  return (
    <p className={[styles.price, styles[size], brand ? styles.brand : ''].join(' ')}>
      <data value={amount}>{formatNumber(amount)}</data>
      {currency && <span className={styles.currency}> RSD</span>}
    </p>
  );
}
