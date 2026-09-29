import styles from './QuantityStepper.module.css';

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Shown after the number, e.g. "RSD" */
  unit?: string;
  /** Accessible names for the − and + buttons */
  decreaseLabel: string;
  increaseLabel: string;
  /** Width of the value area in px (fits the longest value) */
  valueWidth?: number;
}

/** − value + control with 44 px touch targets. Used in the savings calculator and later in the cart. */
export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  unit,
  decreaseLabel,
  increaseLabel,
  valueWidth = 36,
}: QuantityStepperProps) {
  return (
    <div className={styles.stepper}>
      <button
        type="button"
        className={styles.button}
        aria-label={decreaseLabel}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - step))}
      >
        −
      </button>
      <output className={styles.value} style={{ minWidth: valueWidth }} aria-live="polite">
        {value}
        {unit && <span className={styles.unit}> {unit}</span>}
      </output>
      <button
        type="button"
        className={styles.button}
        aria-label={increaseLabel}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + step))}
      >
        +
      </button>
    </div>
  );
}
