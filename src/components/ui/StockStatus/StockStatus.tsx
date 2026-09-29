import styles from './StockStatus.module.css';

export type StockState = 'inStock' | 'outOfStock' | 'madeToOrder';

const labels: Record<StockState, string> = {
  inStock: 'Na stanju',
  outOfStock: 'Nema na stanju',
  madeToOrder: 'Po porudžbini, 3–4 meseca',
};

export interface StockStatusProps {
  state: StockState;
  /** sm = 12 px (compact cards) · md = 14 px */
  size?: 'sm' | 'md';
}

/** Dot + label showing availability. "Po porudžbini" is the made-to-order state agreed with Decor Ambient. */
export function StockStatus({ state, size = 'md' }: StockStatusProps) {
  return (
    <p className={[styles.status, styles[state], styles[size]].join(' ')}>
      <span className={styles.dot} aria-hidden="true" />
      {labels[state]}
    </p>
  );
}
