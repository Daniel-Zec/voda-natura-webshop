import { useEffect, useState } from 'react';
import { formatNumber } from '../../../lib/format';
import {
  CART_EVENT,
  MAX_QTY,
  cartCount,
  isBlocked,
  readCart,
  resolveCart,
  writeCart,
  type CartLine,
  type CartProduct,
  type ResolvedLine,
} from '../../../lib/cartStore';
import { Button } from '../../ui/Button/Button';
import { Icon } from '../../ui/Icon/Icon';
import { QuantityStepper } from '../../ui/QuantityStepper/QuantityStepper';
import { StockStatus } from '../../ui/StockStatus/StockStatus';
import styles from './CartPage.module.css';

export interface CartPageProps {
  /** Every visible product by SKU (current price and stock from the last publish) */
  catalog: Record<string, CartProduct>;
  checkoutHref: string;
  /** "Continue shopping" and empty-cart links */
  shopHref: string;
  /** Second empty-cart link: replacement cartridges (repeat buyers) */
  cartridgesHref: string;
  deliveryEstimate: string;
  /** "Troškove dostave plaćate kuriru prilikom preuzimanja." */
  shippingNote: string;
  /** Storybook: show these lines instead of reading the browser's cart */
  initialLines?: CartLine[];
}

const rsd = (n: number) => `${formatNumber(n)} RSD`;

/**
 * Korpa (/korpa/): the cart saved in the visitor's browser, checked against the current catalogue.
 * Out-of-stock or removed products must be taken out before ordering. Made-to-order products stay
 * in the same order; Decor Ambient calls the customer about them (Daniel, 2 Oct 2026).
 */
export function CartPage({ catalog, checkoutHref, shopHref, cartridgesHref, deliveryEstimate, shippingNote, initialLines }: CartPageProps) {
  const [lines, setLines] = useState<ResolvedLine[] | null>(initialLines ? resolveCart(initialLines, catalog) : null);
  const [updatedPrices, setUpdatedPrices] = useState(false);

  useEffect(() => {
    if (initialLines) return;
    const load = () => {
      const resolved = resolveCart(readCart(), catalog);
      // Keep the stored prices in line with the catalogue, so the header total matches this page.
      if (resolved.some((l) => l.priceChanged)) {
        setUpdatedPrices(true);
        writeCart(resolved.map(({ sku, name, price, qty }) => ({ sku, name, price, qty })));
        return;
      }
      setLines(resolved);
    };
    load();
    window.addEventListener(CART_EVENT, load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener(CART_EVENT, load);
      window.removeEventListener('storage', load);
    };
  }, [catalog, initialLines]);

  const save = (next: ResolvedLine[]) => {
    if (initialLines) setLines(next);
    else writeCart(next.map(({ sku, name, price, qty }) => ({ sku, name, price, qty })));
  };
  const setQty = (sku: string, qty: number) => lines && save(lines.map((l) => (l.sku === sku ? { ...l, qty } : l)));
  const remove = (sku: string) => lines && save(lines.filter((l) => l.sku !== sku));

  if (!lines) return <p className={styles.loading}>Učitavam korpu…</p>;

  if (!lines.length)
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon} aria-hidden="true">
          <Icon name="cart" size={32} />
        </span>
        <h2 className={styles.emptyTitle}>Korpa je prazna</h2>
        <p>Dodajte filter ili uložak dugmetom „Dodaj u korpu” na stranici proizvoda.</p>
        <div className={styles.emptyActions}>
          <Button href={shopHref} variant="primary">
            Pogledaj proizvode
          </Button>
          <Button href={cartridgesHref} variant="outline">
            Ulošci za filter
          </Button>
        </div>
      </div>
    );

  const blocked = lines.filter(isBlocked);
  const orderable = lines.filter((l) => !isBlocked(l));
  const total = orderable.reduce((sum, l) => sum + l.price * l.qty, 0);
  const count = cartCount(orderable);
  const madeToOrder = orderable.some((l) => l.product?.stock === 'madeToOrder');
  const canOrder = blocked.length === 0 && count > 0;

  return (
    <div className={styles.layout}>
      <section aria-label="Proizvodi u korpi" className={styles.list}>
        {updatedPrices && (
          <p className={styles.info} role="status">
            Neke cene su se promenile od kada ste dodali proizvod. Korpa prikazuje trenutne cene.
          </p>
        )}
        {blocked.length > 0 && (
          <p className={styles.warning} role="alert">
            {blocked.length === 1 ? 'Jedan proizvod trenutno nije dostupan' : 'Neki proizvodi trenutno nisu dostupni'}. Uklonite{' '}
            {blocked.length === 1 ? 'ga' : 'ih'} iz korpe da biste nastavili.
          </p>
        )}
        <ul role="list" className={styles.lines}>
          {lines.map((l) => {
            const p = l.product;
            const off = isBlocked(l);
            return (
              <li key={l.sku} className={[styles.line, off ? styles.off : ''].join(' ')}>
                {p ? (
                  <a href={p.href} className={styles.thumb} tabIndex={-1} aria-hidden="true">
                    <img src={p.image.src} alt="" width={88} height={88} loading="lazy" />
                  </a>
                ) : (
                  <span className={styles.thumb} aria-hidden="true" />
                )}
                <div className={styles.info2}>
                  {p ? (
                    <a href={p.href} className={styles.name}>
                      {l.name}
                    </a>
                  ) : (
                    <span className={styles.name}>{l.name}</span>
                  )}
                  <p className={styles.sku}>Šifra: {l.sku}</p>
                  {!p && <p className={styles.lineWarning}>Proizvod više nije u ponudi.</p>}
                  {p?.stock === 'outOfStock' && <p className={styles.lineWarning}>Trenutno nema na stanju.</p>}
                  {p?.stock === 'madeToOrder' && <StockStatus state="madeToOrder" size="sm" />}
                  <p className={styles.unit}>{rsd(l.price)} / kom</p>
                </div>
                <div className={styles.controls}>
                  {!off && (
                    <QuantityStepper
                      value={l.qty}
                      min={1}
                      max={MAX_QTY}
                      onChange={(q) => setQty(l.sku, q)}
                      decreaseLabel={`Smanji količinu: ${l.name}`}
                      increaseLabel={`Povećaj količinu: ${l.name}`}
                    />
                  )}
                  <p className={styles.lineTotal}>{off ? '—' : rsd(l.price * l.qty)}</p>
                  <button type="button" className={styles.remove} onClick={() => remove(l.sku)}>
                    <Icon name="close" size={16} aria-hidden="true" />
                    Ukloni<span className="vn-visually-hidden">: {l.name}</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <a href={shopHref} className={styles.back}>
          <Icon name="arrowLeft" size={18} aria-hidden="true" /> Nastavi kupovinu
        </a>
      </section>

      <aside className={styles.summary} aria-label="Pregled porudžbine">
        <h2 className={styles.summaryTitle}>Pregled</h2>
        <dl className={styles.rows}>
          <div className={styles.row}>
            <dt>Proizvodi ({count} kom)</dt>
            <dd>{rsd(total)}</dd>
          </div>
          <div className={styles.row}>
            <dt>Dostava</dt>
            <dd className={styles.muted}>plaćate kuriru</dd>
          </div>
          <div className={[styles.row, styles.totalRow].join(' ')}>
            <dt>Ukupno za proizvode</dt>
            <dd>{rsd(total)}</dd>
          </div>
        </dl>
        <p className={styles.vat}>Cene su sa PDV-om. {shippingNote}</p>
        {madeToOrder && (
          <p className={styles.note}>
            U korpi je proizvod koji se isporučuje po porudžbini (3–4 meseca). Decor Ambient će vas pozvati da dogovorite da li šaljemo sve zajedno ili
            odvojeno.
          </p>
        )}
        {canOrder ? (
          <Button href={checkoutHref} variant="primary" size="lg" fullWidth iconAfter="arrowRight">
            Nastavi na poručivanje
          </Button>
        ) : (
          <Button variant="primary" size="lg" fullWidth iconAfter="arrowRight" disabled>
            Nastavi na poručivanje
          </Button>
        )}
        <ul role="list" className={styles.trust}>
          <li>
            <Icon name="cash" size={20} aria-hidden="true" /> Plaćate tek kada paket stigne, gotovinom kuriru
          </li>
          <li>
            <Icon name="truck" size={20} aria-hidden="true" /> BEX dostava, {deliveryEstimate}
          </li>
          <li>
            <Icon name="check" size={20} aria-hidden="true" /> Bez registracije i bez plaćanja unapred
          </li>
        </ul>
      </aside>

      {/* Phone: total and the next step stay in reach while scrolling the list */}
      <div className={styles.mobileBar}>
        <div>
          <span className={styles.mobileLabel}>Ukupno za proizvode</span>
          <strong className={styles.mobileTotal}>{rsd(total)}</strong>
        </div>
        {canOrder ? (
          <Button href={checkoutHref} variant="primary">
            Poruči
          </Button>
        ) : (
          <Button variant="primary" disabled>
            Poruči
          </Button>
        )}
      </div>
    </div>
  );
}
