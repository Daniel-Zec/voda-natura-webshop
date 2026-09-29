import styles from './StepList.module.css';

export interface Step {
  title: string;
  text: string;
}

export interface StepListProps {
  steps: Step[];
}

/** Numbered steps ("Kako poručivanje funkcioniše"): 4 cards in a row on desktop, a stacked list on phones. */
export function StepList({ steps }: StepListProps) {
  return (
    <ol role="list" className={styles.list}>
      {steps.map((step, i) => (
        <li key={step.title} className={styles.step}>
          <span className={styles.number} aria-hidden="true">
            {i + 1}
          </span>
          <div className={styles.text}>
            <h3 className={styles.title}>{step.title}</h3>
            <p className={styles.body}>{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
