import { Button } from '../../ui/Button/Button';
import { ArrowLink } from '../../ui/ArrowLink/ArrowLink';
import { Chip } from '../../ui/Chip/Chip';
import { Overline } from '../../ui/Overline/Overline';
import { SearchBar } from '../../ui/SearchBar/SearchBar';
import styles from './ChoosePath.module.css';

export interface ChoosePathProps {
  quiz: {
    href: string;
    questions: string[];
  };
  search: {
    action: string;
    chips: { label: string; href: string }[];
    allHref: string;
  };
}

/**
 * The two ways to shop (Personas: guided Jelena vs. product-aware Marko):
 * "Ne znam šta mi treba" → product finder quiz, "Znam šta tražim" → search by name or code.
 */
export function ChoosePath({ quiz, search }: ChoosePathProps) {
  return (
    <div className={styles.grid}>
      <div className={[styles.panel, styles.quiz].join(' ')}>
        <Overline tone="info">Ne znam šta mi treba</Overline>
        <h3 className={styles.title}>
          <span className={styles.desktopOnly}>Odgovorite na 5 pitanja, mi predlažemo 2–3 rešenja</span>
          <span className={styles.mobileOnly}>5 pitanja, a mi predlažemo 2–3 rešenja</span>
        </h3>
        <ol role="list" className={styles.questions}>
          {quiz.questions.map((q, i) => (
            <li key={q} className={styles.question}>
              <span className={[styles.number, i === 0 ? styles.numberActive : ''].join(' ')} aria-hidden="true">
                {i + 1}
              </span>
              {q}
            </li>
          ))}
        </ol>
        <div className={styles.cta}>
          <Button href={quiz.href} variant="secondary" size="lg" className={styles.ctaButton}>
            Započni – traje 1 minut
          </Button>
          <span className={styles.ctaNote}>Bez e-mail adrese i registracije</span>
        </div>
      </div>

      <div className={[styles.panel, styles.search].join(' ')}>
        <Overline tone="sand">Znam šta tražim</Overline>
        <h3 className={styles.title}>Pronađite proizvod po nazivu ili šifri</h3>
        <SearchBar
          action={search.action}
          tone="warm"
          size="lg"
          placeholder="npr. STO 10, PS 5M, RO 6"
          label="Šifra ili naziv"
          buttonLabel="Traži"
        />
        <div>
          <p className={styles.chipsTitle}>Često traženi ulošci</p>
          <div className={styles.chips}>
            {search.chips.map((chip) => (
              <Chip key={chip.href} href={chip.href}>
                {chip.label}
              </Chip>
            ))}
          </div>
        </div>
        <ArrowLink href={search.allHref}>Svi ulošci po veličini</ArrowLink>
      </div>
    </div>
  );
}
