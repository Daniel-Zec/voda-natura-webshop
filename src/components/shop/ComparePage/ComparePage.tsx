import { useEffect, useMemo, useState } from 'react';
import type { ProductSummary } from '../../../data/types';
import { Button } from '../../ui/Button/Button';
import { Icon } from '../../ui/Icon/Icon';
import { Price } from '../../ui/Price/Price';
import { StockStatus } from '../../ui/StockStatus/StockStatus';
import styles from './ComparePage.module.css';

export interface CompareProduct {
  product: ProductSummary;
  href: string;
  category: string;
  specs: { label: string; value: string }[];
}

export interface ComparePageProps {
  /** Every visible product; the page shows the ones chosen with "Uporedi" */
  products: CompareProduct[];
  /** Where to find more products to compare */
  browse: { label: string; href: string }[];
  /** Storybook: SKUs to show instead of reading the browser's saved list */
  initialSkus?: string[];
}

const KEY = 'vn-compare-v1';
const MAX = 3;

function readSaved(): { sku: string; name: string }[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}
function save(list: { sku: string; name: string }[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage blocked: the page still works for this visit */
  }
  document.querySelectorAll<HTMLElement>('[data-compare-count]').forEach((el) => (el.textContent = String(list.length)));
}

/** Same spec label written differently on different products ("Radni pritisak" vs. "Maksimalni radni pritisak") stays separate on purpose. */
const norm = (v: string) => v.replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * Uporedi (/uporedi/): the up-to-3 products ticked with "Uporedi" on product cards, side by side.
 * The choice lives in the browser (same store as the header counter), so the page is built in the browser.
 */
export function ComparePage({ products, browse, initialSkus }: ComparePageProps) {
  const [skus, setSkus] = useState<string[] | null>(initialSkus ?? null);
  const [onlyDiff, setOnlyDiff] = useState(false);

  useEffect(() => {
    if (initialSkus) return;
    const load = () => setSkus(readSaved().map((x) => x.sku));
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, [initialSkus]);

  const chosen = useMemo(
    () => (skus ?? []).map((s) => products.find((p) => p.product.sku === s)).filter((p): p is CompareProduct => !!p).slice(0, MAX),
    [skus, products],
  );

  const rows = useMemo(() => {
    const labels: string[] = [];
    for (const p of chosen) for (const s of p.specs) if (!labels.includes(s.label)) labels.push(s.label);
    const all = [
      { label: 'Vrsta', values: chosen.map((p) => p.category || '—') },
      { label: 'Ukratko', values: chosen.map((p) => p.product.kicker || '—') },
      { label: 'Šta radi', values: chosen.map((p) => p.product.summary || '—') },
      { label: 'Održavanje', values: chosen.map((p) => p.product.maintenance || '—') },
      ...labels.map((label) => ({ label, values: chosen.map((p) => p.specs.find((s) => s.label === label)?.value ?? '—') })),
    ];
    // A row differs when at least two products have a value and those values are not the same.
    return all.map((r) => {
      const known = r.values.filter((v) => v !== '—').map(norm);
      return { ...r, differs: known.length > 1 && new Set(known).size > 1 };
    });
  }, [chosen]);

  const remove = (sku: string) => {
    const next = readSaved().filter((x) => x.sku !== sku);
    if (!initialSkus) save(next);
    setSkus((cur) => (cur ?? []).filter((s) => s !== sku));
  };
  const clear = () => {
    if (!initialSkus) save([]);
    setSkus([]);
  };

  if (skus === null) return <p className={styles.muted}>Učitavam…</p>;

  if (chosen.length === 0)
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon} aria-hidden="true">
          <Icon name="compare" size={28} />
        </span>
        <h2 className={styles.emptyTitle}>Još niste izabrali proizvode za poređenje</h2>
        <p>Na karticama proizvoda označite „Uporedi“ kod 2 ili 3 proizvoda, pa se vratite ovde. Videćete ih jedan pored drugog: cenu, održavanje i tehničke podatke.</p>
        <ul role="list" className={styles.chips}>
          {browse.map((b) => (
            <li key={b.href}>
              <a className={styles.chip} href={b.href}>
                {b.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );

  const slots = Math.min(MAX, chosen.length + 1);
  const visibleRows = onlyDiff && chosen.length > 1 ? rows.filter((r) => r.differs) : rows;
  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <p className={styles.muted}>
          {chosen.length} od najviše {MAX} proizvoda
          {chosen.length === 1 && ' · dodajte još jedan za poređenje'}
        </p>
        <div className={styles.toolbarRight}>
          {chosen.length > 1 && (
            <label className={styles.check}>
              <input type="checkbox" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} /> Prikaži samo razlike
            </label>
          )}
          <button type="button" className={styles.linkBtn} onClick={clear}>
            Ukloni sve
          </button>
        </div>
      </div>

      <div className={styles.scroller} role="region" aria-label="Tabela poređenja" tabIndex={0}>
        <table className={styles.table} style={{ ['--cols' as string]: slots }}>
          <colgroup>
            <col className={styles.labelCol} />
            {Array.from({ length: slots }, (_, i) => (
              <col key={i} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className={styles.corner}>
                <span className="vn-visually-hidden">Svojstvo</span>
              </th>
              {chosen.map((p) => (
                <th scope="col" key={p.product.sku} className={styles.productCell}>
                  <div className={styles.productInner}>
                  <div className={styles.mediaWrap}>
                    <a href={p.href} className={styles.media} tabIndex={-1} aria-hidden="true">
                      <img src={p.product.image.src} alt="" width={240} height={240} loading="lazy" decoding="async" />
                    </a>
                    <button type="button" className={styles.remove} onClick={() => remove(p.product.sku)} aria-label={`Ukloni ${p.product.name} iz poređenja`} title="Ukloni iz poređenja">
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                  <a href={p.href} className={styles.name} title={p.product.name}>
                    {p.product.name}
                  </a>
                  <div className={styles.priceBlock}>
                    <Price amount={p.product.price} size="sm" />
                    <StockStatus state={p.product.stock} size="sm" />
                  </div>
                  <Button
                    className={styles.buy}
                    variant="primary"
                    icon="cart"
                    fullWidth
                    disabled={p.product.stock === 'outOfStock'}
                    data-add-to-cart={p.product.sku}
                    data-name={p.product.name}
                    data-price={p.product.price}
                  >
                    Dodaj u korpu
                  </Button>
                  </div>
                </th>
              ))}
              {chosen.length < MAX && (
                <th scope="col" className={styles.addCell}>
                  <a href={browse[0]?.href} className={styles.addMore}>
                    <span className={styles.addIcon} aria-hidden="true">
                      <Icon name="plus" size={22} />
                    </span>
                    <span>Dodaj proizvod</span>
                    <span className={styles.addHint}>Označite „Uporedi“ na kartici proizvoda</span>
                  </a>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((r) => [
              // Phones: the row name sits on its own line above the values.
              <tr key={`${r.label}-m`} className={styles.labelRow} aria-hidden="true">
                <td colSpan={slots + 1}>{r.label}</td>
              </tr>,
              <tr key={r.label} className={r.differs && chosen.length > 1 ? styles.diff : undefined}>
                <th scope="row">{r.label}</th>
                {r.values.map((v, i) => (
                  <td key={chosen[i].product.sku}>{v}</td>
                ))}
                {chosen.length < MAX && <td className={styles.emptyCell} aria-hidden="true" />}
              </tr>,
            ])}
          </tbody>
        </table>
      </div>
      {onlyDiff && visibleRows.length === 0 && <p className={styles.muted}>Izabrani proizvodi se ne razlikuju u navedenim podacima.</p>}
      <p className={styles.note}>Podaci su od proizvođača. Označeni su redovi u kojima se vrednosti razlikuju; „—“ znači da podatak za taj proizvod nije naveden.</p>
    </div>
  );
}
