import { useEffect, useMemo, useRef, useState } from 'react';
import { useAdmin } from '../AdminContext';
import { Btn, Card, Check, DataTable, Empty, Field, Input, Loading, Notice, PageHeader, Pill, Select, Tabs, TextArea, ui, useAction, useLoad } from '../components/ui';
import { dateTime, rsd, settingText } from '../lib/labels';
import type { EmailTemplate } from '../lib/types';
import { href } from '../router';
import s from './screens.module.css';

const templateLabel: Record<string, string> = { order_to_partner: 'Porudžbina za DA', order_confirmation: 'Potvrda kupcu', order_admin_copy: 'Kopija meni' };
const vars = ['order_number', 'order_date', 'first_name', 'last_name', 'street', 'house_number', 'apartment', 'city', 'postal_code', 'phone', 'email', 'items', 'total', 'address', 'customer_note', 'delivery_estimate'];

export function Emails({ tab }: { tab: string }) {
  return (
    <>
      <PageHeader title="Emailovi" subtitle="Svi emailovi porudžbina šalju se sa narudzbine@vodanatura.com." />
      <Tabs
        active={tab}
        items={[
          { id: 'sabloni', label: 'Šabloni', href: href('emailovi') },
          { id: 'dnevnik', label: 'Dnevnik slanja', href: href('emailovi', 'dnevnik') },
          { id: 'podesavanja', label: 'Podešavanja emailova', href: href('emailovi', 'podesavanja') },
        ]}
      />
      {tab === 'dnevnik' ? <EmailLog /> : tab === 'podesavanja' ? <EmailSettings /> : <Templates />}
    </>
  );
}

function Templates() {
  const { api, catalog } = useAdmin();
  const { data, reload } = useLoad(() => api.listTemplates(), [api]);
  const { data: orders } = useLoad(() => api.listOrders(), [api]);
  const [key, setKey] = useState('');
  const [draft, setDraft] = useState<EmailTemplate | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const { busy, run } = useAction();

  useEffect(() => {
    if (data && !key) setKey(data[0]?.key ?? '');
  }, [data, key]);
  useEffect(() => {
    const t = data?.find((x) => x.key === key);
    if (t) setDraft({ ...t });
  }, [key, data]);

  const sample = useMemo(() => {
    const o = orders?.[0];
    const base = {
      order_number: 'VN-2026-0001', order_date: '30.09.2026.', first_name: 'Jelena', last_name: 'Petrović', street: 'Bulevar oslobođenja', house_number: '12', apartment: '4',
      city: 'Novi Sad', postal_code: '21000', phone: '+381 64 123 4567', email: 'jelena@example.com', customer_note: '—',
      items: '1 × RO 6 WFU – Sistem Reverzne Osmoze · 56.899 RSD\n2 × BL 10 – Uložak od aktivnog uglja · 1.212 RSD', total: '58.111 RSD',
    };
    const fromOrder = o
      ? {
          order_number: o.order_number, order_date: dateTime(o.created_at), first_name: o.first_name, last_name: o.last_name, street: o.street, house_number: o.house_number,
          apartment: o.apartment ?? '—', city: o.city, postal_code: o.postal_code, phone: o.phone, email: o.email, customer_note: o.customer_note ?? '—',
          items: o.items.map((i) => `${i.quantity} × ${i.name} · ${rsd(i.line_total)}`).join('\n'), total: rsd(o.items_total),
        }
      : base;
    const v = { ...fromOrder, delivery_estimate: catalog ? settingText(catalog.settings, 'delivery_estimate') : 'oko 4 radna dana' } as Record<string, string>;
    v.address = `${v.street} ${v.house_number}${v.apartment && v.apartment !== '—' ? `, stan ${v.apartment}` : ''}\n${v.postal_code} ${v.city}`;
    return v;
  }, [orders, catalog]);

  if (!data || !draft) return <Loading />;
  const fill = (t: string) => t.replace(/\{(\w+)\}/g, (m, k) => sample[k] ?? m);
  const orig = data.find((x) => x.key === draft.key)!;
  const dirty = draft.subject !== orig.subject || draft.body !== orig.body || draft.is_active !== orig.is_active;
  const insert = (v: string) => {
    const el = bodyRef.current;
    const token = `{${v}}`;
    if (!el) return setDraft({ ...draft, body: draft.body + token });
    const { selectionStart: a, selectionEnd: b } = el;
    setDraft({ ...draft, body: draft.body.slice(0, a) + token + draft.body.slice(b) });
    requestAnimationFrame(() => (el.focus(), el.setSelectionRange(a + token.length, a + token.length)));
  };

  return (
    <div className={ui.stack}>
      <div className={ui.toolbar}>
        <Select value={key} onChange={(e) => setKey(e.target.value)} aria-label="Šablon">
          {data.map((t) => (
            <option key={t.key} value={t.key}>
              {t.name}
            </option>
          ))}
        </Select>
        <span className={ui.muted}>Primalac: {draft.recipient === 'partner' ? 'Decor Ambient' : 'kupac'}</span>
      </div>
      <div className={s.cols} style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}>
        <Card title="Šablon">
          <div className={ui.stack}>
            <Field label="Naslov emaila">{(id) => <Input id={id} value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />}</Field>
            <Field label="Tekst" hint="Promenljive se popunjavaju iz porudžbine.">
              {(id) => <TextArea id={id} ref={bodyRef} rows={16} className={ui.mono} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />}
            </Field>
            <div className={s.vars} aria-label="Ubaci promenljivu">
              {vars.map((v) => (
                <button key={v} type="button" onClick={() => insert(v)}>
                  {`{${v}}`}
                </button>
              ))}
            </div>
            <Check label="Šablon je aktivan" checked={draft.is_active} onChange={(v) => setDraft({ ...draft, is_active: v })} />
            {draft.recipient === 'customer' && !/kuriru/i.test(draft.body) && <Notice tone="warning">Email kupcu treba da kaže: „Troškove dostave plaćate kuriru prilikom preuzimanja.”</Notice>}
            <div className={ui.row}>
              <Btn variant="primary" busy={busy} disabled={!dirty} onClick={() => run(async () => (await api.saveTemplate(draft.key, { subject: draft.subject, body: draft.body, is_active: draft.is_active }), reload()), 'Šablon sačuvan')}>
                Sačuvaj
              </Btn>
              <Btn icon="send" disabled title="Radi kada izaberemo servis za slanje (VODANATURA-62).">
                Pošalji test meni
              </Btn>
            </div>
          </div>
        </Card>
        <Card title="Pregled" extra={<small>{orders?.length ? `sa porudžbinom ${sample.order_number}` : 'sa primerom porudžbine'}</small>}>
          <p style={{ margin: '0 0 8px' }}>
            <strong>{fill(draft.subject)}</strong>
          </p>
          <div className={s.preview}>{fill(draft.body)}</div>
        </Card>
      </div>
    </div>
  );
}

function EmailLog() {
  const { api } = useAdmin();
  const { data } = useLoad(() => api.listEmailLog(), [api]);
  const [status, setStatus] = useState('');
  if (!data) return <Loading />;
  const rows = data.filter((e) => !status || e.status === status);
  return (
    <>
      <div className={ui.toolbar}>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">Svi</option>
          <option value="sent">Poslati</option>
          <option value="failed">Greške</option>
          <option value="queued">U redu</option>
        </Select>
      </div>
      <DataTable
        label="Dnevnik slanja"
        rows={rows}
        rowKey={(e) => e.id}
        columns={[
          { key: 'd', header: 'Vreme', render: (e) => <span className={ui.nowrap}>{dateTime(e.created_at)}</span>, sort: (e) => e.created_at },
          { key: 't', header: 'Šablon', render: (e) => templateLabel[e.template] ?? e.template },
          { key: 'r', header: 'Primalac', render: (e) => e.recipient },
          { key: 's', header: 'Naslov', render: (e) => e.subject },
          { key: 'o', header: 'Porudžbina', render: (e) => (e.order_id ? <a href={href('porudzbine', e.order_id)}>otvori</a> : '—') },
          { key: 'st', header: 'Status', render: (e) => (<>{e.status === 'sent' ? <Pill tone="success">Poslat</Pill> : e.status === 'failed' ? <Pill tone="error">Greška</Pill> : <Pill tone="info">U redu</Pill>}{e.error && <div className={ui.cellSub}>{e.error}</div>}</>) },
          { key: 'x', header: '', render: () => <Btn size="sm" icon="send" disabled title="Radi kada izaberemo servis za slanje (VODANATURA-62).">Ponovo</Btn> },
        ]}
        initialSort={{ key: 'd', dir: 'desc' }}
        empty={<Empty icon="mail" title="Još nije poslat nijedan email" />}
      />
    </>
  );
}

function EmailSettings() {
  const { api, catalog, reloadCatalog } = useAdmin();
  const [v, setV] = useState<Record<string, unknown> | null>(null);
  const { busy, run } = useAction();
  useEffect(() => {
    if (catalog && !v)
      setV({
        order_sender_email: settingText(catalog.settings, 'order_sender_email'),
        partner_order_email: settingText(catalog.settings, 'partner_order_email'),
        admin_notify_email: settingText(catalog.settings, 'admin_notify_email'),
        email_test_mode: catalog.settings.email_test_mode === true,
      });
  }, [catalog, v]);
  if (!catalog || !v) return <Loading />;
  const emailOk = (x: unknown) => !x || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(x));
  const valid = ['order_sender_email', 'partner_order_email', 'admin_notify_email'].every((k) => emailOk(v[k]));
  return (
    <Card>
      <div className={ui.stack} style={{ maxWidth: 560 }}>
        {v.email_test_mode === true && <Notice tone="warning">Test režim je uključen: svaki email ide vama umesto DA i kupcima. Isključite ga tek kada checkout bude testiran od početka do kraja.</Notice>}
        <Field label="Pošiljalac emailova porudžbina">{(id) => <Input id={id} type="email" value={String(v.order_sender_email)} onChange={(e) => setV({ ...v, order_sender_email: e.target.value })} />}</Field>
        <Field label="Adresa DA za nove porudžbine" hint="Još je nemamo od DA." error={emailOk(v.partner_order_email) ? undefined : 'Neispravna adresa'}>
          {(id) => <Input id={id} type="email" placeholder="npr. porudzbine@decorambient.com" value={String(v.partner_order_email)} onChange={(e) => setV({ ...v, partner_order_email: e.target.value })} />}
        </Field>
        <Field label="Kopija svake porudžbine na">{(id) => <Input id={id} type="email" value={String(v.admin_notify_email)} onChange={(e) => setV({ ...v, admin_notify_email: e.target.value })} />}</Field>
        <Check label="Test režim (svi emailovi idu meni)" checked={v.email_test_mode === true} onChange={(x) => setV({ ...v, email_test_mode: x })} />
        <Notice tone="info">Servis za slanje emailova još nije izabran (VODANATURA-62). Kada se izabere, ovde dolazi i dugme „Pošalji test email”.</Notice>
        <div>
          <Btn
            variant="primary"
            busy={busy}
            disabled={!valid}
            onClick={() =>
              run(
                async () => (
                  await api.saveSettings({
                    order_sender_email: v.order_sender_email || null,
                    partner_order_email: v.partner_order_email || null,
                    admin_notify_email: v.admin_notify_email || null,
                    email_test_mode: v.email_test_mode,
                  }),
                  await reloadCatalog()
                ),
                'Podešavanja emailova sačuvana',
              )
            }
          >
            Sačuvaj
          </Btn>
        </div>
      </div>
    </Card>
  );
}
