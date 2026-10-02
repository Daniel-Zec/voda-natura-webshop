import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { formatNumber } from '../../../lib/format';
import { CART_EVENT, cartCount, clearCart, isBlocked, readCart, resolveCart, writeCart, type CartLine, type CartProduct, type ResolvedLine } from '../../../lib/cartStore';
import { Button } from '../../ui/Button/Button';
import { Icon } from '../../ui/Icon/Icon';
import styles from './CheckoutForm.module.css';

export interface CheckoutFormProps {
  catalog: Record<string, CartProduct>;
  /** URL of the `create-order` Edge Function */
  endpoint: string;
  /** Thank-you page; the order number is added as ?broj= */
  thanksHref: string;
  cartHref: string;
  termsHref: string;
  privacyHref: string;
  /** Shown when ordering fails, e.g. "+381 63 29 22 19" */
  phone: string;
  deliveryEstimate: string;
  shippingNote: string;
  /** Seller and issuer of the invoice, e.g. "Decorambient d.o.o., Subotica" */
  seller: string;
  /** Storybook: these lines instead of the browser's cart, and pretend to send */
  initialLines?: CartLine[];
  demo?: boolean;
}

type FieldName = 'first_name' | 'last_name' | 'street' | 'house_number' | 'apartment' | 'postal_code' | 'city' | 'phone' | 'email' | 'customer_note' | 'consent';
type State = { kind: 'idle' } | { kind: 'sending' } | { kind: 'error'; text: string; unavailable?: string[] };

const rsd = (n: number) => `${formatNumber(n)} RSD`;
const fieldMessages: Partial<Record<FieldName, string>> = {
  first_name: 'Upišite ime.',
  last_name: 'Upišite prezime.',
  street: 'Upišite ulicu.',
  house_number: 'Upišite kućni broj.',
  postal_code: 'Poštanski broj ima 5 cifara, npr. 24000.',
  city: 'Upišite mesto.',
  phone: 'Upišite broj telefona, npr. 063 123 4567.',
  email: 'Upišite ispravnu email adresu.',
  consent: 'Potvrdite da prihvatate uslove kupovine.',
};

/**
 * Poručivanje (/porudzbina/): guest checkout in Decor Ambient's order format (Ime, Prezime, Ulica,
 * Broj, Stan, Grad, Poštanski broj, Telefon, Email) plus a note. Sends the cart to the `create-order`
 * function, which re-prices it, saves the order and emails Decor Ambient and the customer.
 */
export function CheckoutForm(props: CheckoutFormProps) {
  const { catalog, endpoint, thanksHref, cartHref, termsHref, privacyHref, phone, deliveryEstimate, shippingNote, seller, initialLines, demo = false } = props;
  const [lines, setLines] = useState<ResolvedLine[] | null>(initialLines ? resolveCart(initialLines, catalog) : null);
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const token = useRef<string>('');
  const started = useRef(Date.now());

  useEffect(() => {
    token.current = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : '';
    if (initialLines) return;
    const load = () => setLines(resolveCart(readCart(), catalog));
    load();
    window.addEventListener(CART_EVENT, load);
    return () => window.removeEventListener(CART_EVENT, load);
  }, [catalog, initialLines]);

  if (!lines) return <p className={styles.loading}>Učitavam porudžbinu…</p>;

  const orderable = lines.filter((l) => !isBlocked(l));
  const blocked = lines.filter(isBlocked);
  if (!orderable.length || blocked.length)
    return (
      <div className={styles.empty}>
        <h2 className={styles.emptyTitle}>{orderable.length ? 'Proverite korpu' : 'Korpa je prazna'}</h2>
        <p>{orderable.length ? 'Neki proizvodi iz korpe trenutno nisu dostupni. Uklonite ih u korpi, pa nastavite.' : 'Dodajte proizvode u korpu, pa se vratite ovde da poručite.'}</p>
        <Button href={cartHref} variant="primary" icon="cart">
          Idi u korpu
        </Button>
      </div>
    );

  const total = orderable.reduce((sum, l) => sum + l.price * l.qty, 0);
  const madeToOrder = orderable.some((l) => l.product?.stock === 'madeToOrder');

  const onSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const value = (k: string) => String(data.get(k) ?? '').trim();

    // Client checks mirror the server; the server has the last word.
    const next: Partial<Record<FieldName, string>> = {};
    (['first_name', 'last_name', 'street', 'house_number', 'city'] as FieldName[]).forEach((k) => {
      if (value(k).length < (k === 'house_number' ? 1 : 2)) next[k] = fieldMessages[k];
    });
    if (!/^\d{5}$/.test(value('postal_code'))) next.postal_code = fieldMessages.postal_code;
    if (value('phone').replace(/\D/g, '').length < 8) next.phone = fieldMessages.phone;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value('email'))) next.email = fieldMessages.email;
    if (data.get('consent') !== 'on') next.consent = fieldMessages.consent;
    setErrors(next);
    if (Object.keys(next).length) {
      const first = Object.keys(next)[0];
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    if (value('website') || Date.now() - started.current < 2000) {
      setState({ kind: 'error', text: 'Porudžbina nije poslata. Pokušajte ponovo za nekoliko sekundi.' });
      return;
    }

    let source = '';
    try {
      source = sessionStorage.getItem('vn-source') ?? '';
    } catch {
      /* storage blocked */
    }
    const body = {
      first_name: value('first_name'),
      last_name: value('last_name'),
      street: value('street'),
      house_number: value('house_number'),
      apartment: value('apartment'),
      postal_code: value('postal_code'),
      city: value('city'),
      phone: value('phone'),
      email: value('email'),
      customer_note: value('customer_note'),
      consent: true,
      items: orderable.map((l) => ({ sku: l.sku, qty: l.qty })),
      client_token: token.current,
      source,
    };

    setState({ kind: 'sending' });
    try {
      let result: { order_number: string; items_total: number };
      if (demo) {
        await new Promise((r) => setTimeout(r, 700));
        result = { order_number: 'VN-2026-0001', items_total: total };
      } else {
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const json = await res.json().catch(() => ({}));
        if (res.status === 422 && json.fields) {
          const fe: Partial<Record<FieldName, string>> = {};
          Object.keys(json.fields).forEach((k) => (fe[k as FieldName] = fieldMessages[k as FieldName] ?? 'Proverite ovo polje.'));
          setErrors(fe);
          setState({ kind: 'error', text: 'Proverite označena polja.' });
          return;
        }
        if (res.status === 409 && Array.isArray(json.skus)) {
          setState({ kind: 'error', text: 'Neki proizvodi su u međuvremenu rasprodati:', unavailable: json.skus });
          return;
        }
        if (res.status === 429) {
          setState({ kind: 'error', text: 'Sa ovog broja telefona je upravo poslato više porudžbina. Sačekajte desetak minuta ili nas pozovite.' });
          return;
        }
        if (!res.ok || !json.order_number) throw new Error(String(res.status));
        result = json;
      }
      try {
        sessionStorage.setItem(
          'vn-last-order',
          JSON.stringify({ number: result.order_number, email: body.email, total: result.items_total, madeToOrder }),
        );
      } catch {
        /* storage blocked: the thank-you page still shows the number from the address */
      }
      if (!demo) {
        clearCart();
        window.location.href = `${thanksHref}?broj=${encodeURIComponent(result.order_number)}`;
      } else setState({ kind: 'idle' });
    } catch {
      setState({ kind: 'error', text: 'Porudžbina nije poslata zbog tehničke greške. Pokušajte ponovo ili poručite telefonom.' });
    }
  };

  const removeUnavailable = (skus: string[]) => {
    const next = readCart().filter((l) => !skus.includes(l.sku));
    writeCart(next);
    setState({ kind: 'idle' });
  };

  const sending = state.kind === 'sending';
  const field = (name: FieldName, label: string, input: ReactNode, optional = false) => (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={`co-${name}`}>
        {label} {optional && <span className={styles.optional}>(neobavezno)</span>}
      </label>
      {input}
      {errors[name] && (
        <p className={styles.fieldError} id={`co-${name}-error`}>
          {errors[name]}
        </p>
      )}
    </div>
  );
  const a11y = (name: FieldName) => ({
    id: `co-${name}`,
    name,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `co-${name}-error` : undefined,
    className: styles.input,
  });

  return (
    <div className={styles.layout}>
      <form
        className={styles.form}
        onSubmit={onSubmit}
        noValidate
        onChange={(e) => {
          // Clear a field's message as soon as it is corrected.
          const name = (e.target as unknown as HTMLInputElement).name as FieldName;
          if (errors[name]) setErrors(({ [name]: _, ...rest }) => rest as typeof errors);
        }}
      >
        <fieldset className={styles.group}>
          <legend className={styles.legend}>Kome šaljemo</legend>
          <div className={styles.row2}>
            {field('first_name', 'Ime', <input {...a11y('first_name')} autoComplete="given-name" maxLength={60} required />)}
            {field('last_name', 'Prezime', <input {...a11y('last_name')} autoComplete="family-name" maxLength={60} required />)}
          </div>
          <div className={styles.row2}>
            {field('phone', 'Telefon', <input {...a11y('phone')} type="tel" inputMode="tel" autoComplete="tel" maxLength={30} placeholder="06x xxx xxxx" required />)}
            {field('email', 'Email', <input {...a11y('email')} type="email" autoComplete="email" maxLength={200} required />)}
          </div>
          <p className={styles.hint}>Telefon je potreban kuriru za dostavu. Na email stiže potvrda porudžbine.</p>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.legend}>Adresa za dostavu</legend>
          <div className={styles.rowStreet}>
            {field('street', 'Ulica', <input {...a11y('street')} autoComplete="address-line1" maxLength={120} required />)}
            {field('house_number', 'Broj', <input {...a11y('house_number')} maxLength={20} required />)}
            {field('apartment', 'Stan', <input {...a11y('apartment')} autoComplete="address-line2" maxLength={20} />, true)}
          </div>
          <div className={styles.rowCity}>
            {field('postal_code', 'Poštanski broj', <input {...a11y('postal_code')} inputMode="numeric" autoComplete="postal-code" maxLength={5} pattern="\d{5}" required />)}
            {field('city', 'Mesto', <input {...a11y('city')} autoComplete="address-level2" maxLength={60} required />)}
          </div>
          {field(
            'customer_note',
            'Napomena',
            <textarea {...a11y('customer_note')} className={`${styles.input} ${styles.textarea}`} maxLength={1000} rows={3} placeholder="Npr. sprat, interfon ili kada ste kod kuće" />,
            true,
          )}
        </fieldset>

        {/* Trap for bots: hidden from people and screen readers */}
        <label className={styles.trap} aria-hidden="true">
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>

        <div className={styles.consentBox}>
          <label className={styles.consent}>
            <input type="checkbox" name="consent" aria-invalid={errors.consent ? true : undefined} aria-describedby={errors.consent ? 'co-consent-error' : undefined} />
            <span>
              Pročitao/la sam i prihvatam <a href={termsHref} target="_blank" rel="noopener">uslove kupovine</a> i{' '}
              <a href={privacyHref} target="_blank" rel="noopener">politiku privatnosti</a>.
            </span>
          </label>
          {errors.consent && (
            <p className={styles.fieldError} id="co-consent-error">
              {errors.consent}
            </p>
          )}
        </div>

        {state.kind === 'error' && (
          <div className={styles.error} role="alert">
            <p>
              {state.text} {!state.unavailable && <>({phone})</>}
            </p>
            {state.unavailable && (
              <>
                <ul>
                  {state.unavailable.map((sku) => (
                    <li key={sku}>{catalog[sku]?.name ?? sku}</li>
                  ))}
                </ul>
                <Button variant="outline" onClick={() => removeUnavailable(state.unavailable!)}>
                  Ukloni ih iz porudžbine
                </Button>
              </>
            )}
          </div>
        )}

        <div className={styles.submit}>
          <Button type="submit" variant="primary" size="lg" fullWidth icon="check" disabled={sending}>
            {sending ? 'Šaljem porudžbinu…' : `Poruči · ${rsd(total)}`}
          </Button>
          <p className={styles.submitNote}>Plaćate gotovinom kuriru kada paket stigne. {shippingNote}</p>
        </div>
      </form>

      <aside className={styles.summary} aria-label="Vaša porudžbina">
        <div className={styles.summaryHead}>
          <h2 className={styles.summaryTitle}>Vaša porudžbina</h2>
          <a href={cartHref} className={styles.edit}>
            Izmeni
          </a>
        </div>
        <ul role="list" className={styles.items}>
          {orderable.map((l) => (
            <li key={l.sku} className={styles.item}>
              <img src={l.product!.image.src} alt="" width={48} height={48} loading="lazy" />
              <span className={styles.itemName}>
                {l.name}
                <span className={styles.itemMeta}>
                  {l.qty} × {rsd(l.price)}
                  {l.product?.stock === 'madeToOrder' && ' · po porudžbini'}
                </span>
              </span>
              <span className={styles.itemTotal}>{rsd(l.price * l.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className={styles.rows}>
          <div className={styles.row}>
            <dt>Proizvodi ({cartCount(orderable)} kom)</dt>
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
        <p className={styles.small}>Cene su sa PDV-om.</p>
        {madeToOrder && (
          <p className={styles.note}>
            Neki proizvodi se isporučuju po porudžbini (3–4 meseca). Decor Ambient će vas pozvati da dogovorite da li šaljemo sve zajedno ili odvojeno.
          </p>
        )}
        <ul role="list" className={styles.facts}>
          <li>
            <Icon name="cash" size={20} aria-hidden="true" /> Plaćanje pouzećem, gotovinom kuriru
          </li>
          <li>
            <Icon name="truck" size={20} aria-hidden="true" /> BEX dostava, {deliveryEstimate}
          </li>
          <li>
            <Icon name="shield" size={20} aria-hidden="true" /> Prodavac i račun: {seller}
          </li>
        </ul>
      </aside>
    </div>
  );
}
