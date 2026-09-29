import type { FaqItem } from '../../../data/types';
import styles from './FaqList.module.css';

export interface FaqListProps {
  items: FaqItem[];
  /** Index of the question open on load (default: first). -1 = all closed. */
  defaultOpen?: number;
}

/**
 * FAQ accordion built on <details>/<summary>: works without JavaScript, and the answers
 * stay in the HTML when closed, as the SEO guide requires.
 */
export function FaqList({ items, defaultOpen = 0 }: FaqListProps) {
  return (
    <div className={styles.list}>
      {items.map((item, i) => (
        <details key={item.question} className={styles.item} open={i === defaultOpen}>
          <summary className={styles.question}>
            {item.question}
            <span className={styles.sign} aria-hidden="true" />
          </summary>
          <p className={styles.answer}>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
