import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Button } from '../../ui/Button/Button';
import { Icon } from '../../ui/Icon/Icon';
import styles from './ContactForm.module.css';

export type ContactTopic = 'izbor' | 'ugradnja' | 'porudzbina' | 'reklamacija' | 'drugo';

export const contactTopics: { value: ContactTopic; label: string }[] = [
  { value: 'izbor', label: 'Izbor filtera' },
  { value: 'ugradnja', label: 'Ugradnja' },
  { value: 'porudzbina', label: 'Moja porudžbina' },
  { value: 'reklamacija', label: 'Reklamacija' },
  { value: 'drugo', label: 'Nešto drugo' },
];

export interface ContactFormProps {
  /** Supabase REST endpoint of the contact_messages table */
  endpoint: string;
  /** Public (publishable) Supabase key */
  apiKey: string;
  /** Shown when sending fails, e.g. "+381 63 29 22 19" */
  fallbackPhone: string;
  /** Pre-selected topic; a ?tema= query in the address wins */
  defaultTopic?: ContactTopic;
  /** Storybook: pretend to send instead of calling the endpoint */
  demo?: boolean;
}

type State = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent'; name: string } | { kind: 'error'; text: string };

/**
 * Contact form for /kontakt/. Saves the message in Supabase (table contact_messages, insert only);
 * Daniel reads it in the admin panel → Poruke. Spam: a hidden trap field, a minimum fill time and
 * a database limit per email address.
 */
export function ContactForm({ endpoint, apiKey, fallbackPhone, defaultTopic = 'izbor', demo = false }: ContactFormProps) {
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [topic, setTopic] = useState<ContactTopic>(defaultTopic);
  const started = useRef(Date.now());

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tema');
    if (t && contactTopics.some((x) => x.value === t)) setTopic(t as ContactTopic);
  }, []);

  const onSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const value = (k: string) => String(data.get(k) ?? '').trim();

    // Bots fill hidden fields and submit within a second or two: pretend it worked.
    if (value('website') || Date.now() - started.current < 2500) {
      setState({ kind: 'sent', name: value('name') });
      return;
    }

    const body = {
      name: value('name'),
      email: value('email'),
      phone: value('phone') || null,
      topic,
      message: value('message'),
      page: document.referrer ? new URL(document.referrer).pathname.slice(0, 300) : window.location.pathname,
    };

    setState({ kind: 'sending' });
    try {
      if (demo) await new Promise((r) => setTimeout(r, 600));
      else {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const text = await res.text();
          if (text.includes('rate_limited')) {
            setState({ kind: 'error', text: 'Već ste nam poslali nekoliko poruka. Sačekajte desetak minuta ili nas pozovite.' });
            return;
          }
          throw new Error(text || String(res.status));
        }
      }
      form.reset();
      setState({ kind: 'sent', name: body.name });
    } catch {
      setState({ kind: 'error', text: 'Poruka nije poslata zbog tehničke greške. Pokušajte ponovo ili nas pozovite.' });
    }
  };

  if (state.kind === 'sent')
    return (
      <div className={styles.done} role="status">
        <span className={styles.doneIcon} aria-hidden="true">
          <Icon name="check" size={28} />
        </span>
        <h2 className={styles.doneTitle}>Hvala{state.name ? `, ${state.name.split(' ')[0]}` : ''}! Poruka je poslata.</h2>
        <p>Odgovaramo radnim danima, najčešće istog ili sledećeg dana. Ako je hitno, pozovite {fallbackPhone}.</p>
        <Button variant="outline" onClick={() => setState({ kind: 'idle' })}>
          Pošalji novu poruku
        </Button>
      </div>
    );

  const sending = state.kind === 'sending';
  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate={false}>
      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Ime i prezime</span>
          <input className={styles.input} name="name" autoComplete="name" required minLength={2} maxLength={120} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input className={styles.input} name="email" type="email" autoComplete="email" required maxLength={200} />
        </label>
      </div>
      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>
            Telefon <span className={styles.optional}>(nije obavezno)</span>
          </span>
          <input className={styles.input} name="phone" type="tel" autoComplete="tel" maxLength={40} inputMode="tel" />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Tema</span>
          <select className={styles.input} name="topic" value={topic} onChange={(e) => setTopic(e.target.value as ContactTopic)}>
            {contactTopics.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={styles.field}>
        <span className={styles.label}>Poruka</span>
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          name="message"
          required
          minLength={5}
          maxLength={5000}
          rows={6}
          placeholder="Npr. stan ili kuća, gradski vodovod ili bunar, šta vam smeta u vodi…"
        />
      </label>

      {/* Trap for bots: hidden from people and screen readers */}
      <label className={styles.trap} aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>

      {state.kind === 'error' && (
        <p className={styles.error} role="alert">
          {state.text} ({fallbackPhone})
        </p>
      )}

      <div className={styles.actions}>
        <Button type="submit" variant="primary" size="lg" iconAfter="arrowRight" disabled={sending}>
          {sending ? 'Šaljem…' : 'Pošalji poruku'}
        </Button>
        <p className={styles.note}>Vaše podatke koristimo samo da bismo vam odgovorili.</p>
      </div>
    </form>
  );
}
