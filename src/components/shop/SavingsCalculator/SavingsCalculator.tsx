import { useState, type ReactNode } from 'react';
import { QuantityStepper } from '../../ui/QuantityStepper/QuantityStepper';
import { Button } from '../../ui/Button/Button';
import { formatNumber } from '../../../lib/format';
import styles from './SavingsCalculator.module.css';

export interface SavingsCalculatorProps {
  /** Litres of drinking water per person per day. Assumption to confirm (VODANATURA-50). */
  litresPerPersonPerDay?: number;
  /** Bottle size in litres */
  bottleLitres?: number;
  defaultPeople?: number;
  /** RSD per litre of bottled water */
  defaultPricePerLitre?: number;
  /** Comparison note under the results (passed as children, so Astro can render it as static HTML) */
  children?: ReactNode;
  cta?: { href: string; label: string };
}

/**
 * "How many bottles does your family carry home in a year?" — the bottled-water story.
 * Needs JavaScript (loaded as a React island when it scrolls into view); without it
 * the default numbers are still shown.
 */
export function SavingsCalculator({
  litresPerPersonPerDay = 2,
  bottleLitres = 1.5,
  defaultPeople = 4,
  defaultPricePerLitre = 45,
  children,
  cta,
}: SavingsCalculatorProps) {
  const [people, setPeople] = useState(defaultPeople);
  const [price, setPrice] = useState(defaultPricePerLitre);

  const litres = people * litresPerPersonPerDay * 365;
  const results = [
    { value: formatNumber(litres / bottleLitres), label: `flaša od ${String(bottleLitres).replace('.', ',')} l godišnje` },
    { value: `${formatNumber(litres)} kg`, label: 'nosite od prodavnice' },
    { value: formatNumber(litres * price), label: 'RSD godišnje za vodu' },
  ];

  return (
    <div className={styles.card}>
      <div className={styles.row}>
        <div>
          <p className={styles.label}>Broj ukućana</p>
          <p className={styles.hint}>
            <span className={styles.long}>oko {litresPerPersonPerDay} litra vode dnevno po osobi</span>
            <span className={styles.short}>oko {litresPerPersonPerDay} l dnevno po osobi</span>
          </p>
        </div>
        <QuantityStepper
          value={people}
          onChange={setPeople}
          min={1}
          max={10}
          decreaseLabel="Manje ukućana"
          increaseLabel="Više ukućana"
        />
      </div>
      <div className={styles.row}>
        <div>
          <p className={styles.label}>
            Cena litra<span className={styles.long}> flaširane vode</span>
          </p>
          <p className={styles.hint}>
            <span className={styles.long}>unesite cenu koju vi plaćate</span>
            <span className={styles.short}>koju vi plaćate</span>
          </p>
        </div>
        <QuantityStepper
          value={price}
          onChange={setPrice}
          min={10}
          max={200}
          step={5}
          unit="RSD"
          valueWidth={76}
          decreaseLabel="Niža cena"
          increaseLabel="Viša cena"
        />
      </div>
      <hr className={styles.divider} />
      <dl className={styles.results} aria-live="polite">
        {results.map((r) => (
          <div key={r.label} className={styles.result}>
            <dt className={styles.resultLabel}>{r.label}</dt>
            <dd className={styles.resultValue}>{r.value}</dd>
          </div>
        ))}
      </dl>
      {children && <div className={styles.comparison}>{children}</div>}
      {cta && (
        <Button href={cta.href} variant="primary" size="lg" className={styles.cta}>
          {cta.label}
        </Button>
      )}
    </div>
  );
}
