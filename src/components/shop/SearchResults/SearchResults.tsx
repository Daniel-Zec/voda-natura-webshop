import { useEffect, useMemo, useState } from 'react';
import type { ProductSummary } from '../../../data/types';
import { CODE_MATCH, score } from '../../../lib/search';
import { Icon } from '../../ui/Icon/Icon';
import { ProductCard } from '../ProductCard/ProductCard';
import styles from './SearchResults.module.css';

export interface SearchProduct {
  product: ProductSummary;
  href: string;
  category: string;
}
export interface SearchGuide {
  title: string;
  description: string;
  href: string;
}

export interface SearchResultsProps {
  products: SearchProduct[];
  guides: SearchGuide[];
  /** Links shown when nothing is found */
  suggestions: { label: string; href: string }[];
  contactHref: string;
  /** Storybook / tests: the query to show without reading the address */
  initialQuery?: string;
}

/**
 * /pretraga/?q=…: searches all products by name or code (and the guides) in the browser.
 * The query stays in the address, so results can be shared and the back button works.
 */
export function SearchResults({ products, guides, suggestions, contactHref, initialQuery }: SearchResultsProps) {
  const [query, setQuery] = useState(initialQuery ?? '');
  const [ready, setReady] = useState(initialQuery !== undefined);

  useEffect(() => {
    if (initialQuery !== undefined) return;
    const read = () => setQuery(new URLSearchParams(window.location.search).get('q') ?? '');
    read();
    setReady(true);
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, [initialQuery]);

  const update = (value: string) => {
    setQuery(value);
    if (initialQuery !== undefined) return;
    const u = new URL(window.location.href);
    if (value.trim()) u.searchParams.set('q', value);
    else u.searchParams.delete('q');
    window.history.replaceState(null, '', u);
  };

  const productHits = useMemo(() => {
    const scored = products
      .map((p) => ({ p, s: score({ code: p.product.sku, name: p.product.name, extra: `${p.category} ${p.product.kicker ?? ''} ${p.product.summary}` }, query) }))
      .filter((x) => x.s > 0);
    // Typing a code ("STO 10", "PS 5M") shows only the products with that code.
    const byCode = scored.some((x) => x.s >= CODE_MATCH) ? scored.filter((x) => x.s >= CODE_MATCH) : scored;
    return byCode.sort((a, b) => b.s - a.s || a.p.product.name.localeCompare(b.p.product.name, 'sr')).map((x) => x.p);
  }, [products, query]);
  const guideHits = useMemo(
    () => guides.filter((g) => score({ code: '', name: g.title, extra: g.description }, query) > 0).slice(0, 3),
    [guides, query],
  );

  const q = query.trim();
  return (
    <div className={styles.wrap}>
      <form className={styles.form} role="search" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="pretraga-q" className="vn-visually-hidden">
          Pretraga proizvoda
        </label>
        <Icon name="search" size={20} className={styles.formIcon} />
        <input
          id="pretraga-q"
          className={styles.input}
          type="search"
          name="q"
          value={query}
          onChange={(e) => update(e.target.value)}
          placeholder="Naziv ili šifra, npr. BL 10, RO 6, filter za tuš"
          autoComplete="off"
          enterKeyHint="search"
        />
      </form>

      {ready && q && (
        <p className={styles.summary} aria-live="polite">
          {productHits.length > 0 ? (
            <>
              <strong>{productHits.length}</strong> {productHits.length === 1 ? 'proizvod' : 'proizvoda'} za „{q}“
            </>
          ) : (
            <>Nema proizvoda za „{q}“</>
          )}
        </p>
      )}

      {ready && !q && <p className={styles.summary}>Upišite naziv ili šifru proizvoda.</p>}

      {productHits.length > 0 && (
        <ul role="list" className={styles.grid}>
          {productHits.map((p) => (
            <li key={p.product.sku}>
              <ProductCard product={p.product} href={p.href} />
            </li>
          ))}
        </ul>
      )}

      {ready && q && productHits.length === 0 && (
        <div className={styles.empty}>
          <p>Proverite da li je šifra tačno upisana (npr. „PS 5M“, „STO 10“) ili pogledajte:</p>
          <ul role="list" className={styles.chips}>
            {suggestions.map((s) => (
              <li key={s.href}>
                <a href={s.href} className={styles.chip}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <p>
            Ne nalazite ono što tražite? <a href={contactHref}>Pišite nam</a> i pomoći ćemo.
          </p>
        </div>
      )}

      {guideHits.length > 0 && (
        <section className={styles.guides} aria-labelledby="pretraga-vodici">
          <h2 id="pretraga-vodici" className={styles.guidesTitle}>
            Iz saveta o vodi
          </h2>
          <ul role="list">
            {guideHits.map((g) => (
              <li key={g.href}>
                <a href={g.href}>{g.title}</a>
                <span>{g.description}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
