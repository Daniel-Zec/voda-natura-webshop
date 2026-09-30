import { useEffect, useState } from 'react';
import { useAdmin } from '../AdminContext';
import { Btn, Card, Field, Input, Loading, Modal, Notice, PageHeader, Pill, Select, TextArea, ui, useAction, useLoad } from '../components/ui';
import { dateTime, money2, nextStatuses, orderStatusLabel, orderStatusTone, pct, rsd } from '../lib/labels';
import type { OrderStatus } from '../lib/types';
import { href } from '../router';
import s from './screens.module.css';

const templateLabel: Record<string, string> = { order_to_partner: 'Porudžbina za DA', order_confirmation: 'Potvrda kupcu' };

export function OrderDetail({ id }: { id: number }) {
  const { api, openProduct } = useAdmin();
  const { data, error, reload } = useLoad(async () => {
    const orders = await api.listOrders();
    const order = orders.find((o) => o.id === id) ?? null;
    const activity = order ? await api.orderActivity(id) : { history: [], emails: [] };
    return { order, ...activity };
  }, [api, id]);
  const { busy, run } = useAction();
  const [statusOpen, setStatusOpen] = useState(false);
  const [next, setNext] = useState<OrderStatus | ''>('');
  const [note, setNote] = useState('');
  const [tracking, setTracking] = useState('');
  const [internal, setInternal] = useState('');

  useEffect(() => {
    if (data?.order) {
      setTracking(data.order.tracking_code ?? '');
      setInternal(data.order.internal_note ?? '');
    }
  }, [data?.order]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data) return <Loading />;
  const o = data.order;
  if (!o) return <Notice tone="warning">Porudžbina ne postoji. <a href={href('porudzbine')}>Nazad na listu</a>.</Notice>;
  const options = nextStatuses[o.status];

  const saveStatus = () =>
    next &&
    run(async () => {
      await api.setOrderStatus(o.id, next, note);
      setStatusOpen(false);
      setNote('');
      setNext('');
      reload();
    }, `Status promenjen: ${orderStatusLabel[next]}`);

  const addr = [`${o.street} ${o.house_number}${o.apartment ? `, stan ${o.apartment}` : ''}`, `${o.postal_code} ${o.city}`];

  return (
    <>
      <PageHeader
        back={{ href: href('porudzbine'), label: 'Porudžbine' }}
        title={
          <span style={{ display: 'inline-flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {o.order_number} <Pill tone={orderStatusTone[o.status]}>{orderStatusLabel[o.status]}</Pill>
          </span>
        }
        subtitle={`Poručeno ${dateTime(o.created_at)}${o.delivered_at ? ` · isporučeno ${dateTime(o.delivered_at)}` : ''}`}
        actions={
          <>
            {options.includes('cancelled') && (
              <Btn variant="danger" icon="close" onClick={() => (setNext('cancelled'), setStatusOpen(true))}>
                Otkaži
              </Btn>
            )}
            <Btn variant="primary" icon="refresh" disabled={!options.length} onClick={() => (setNext(options.find((x) => x !== 'cancelled') ?? ''), setStatusOpen(true))}>
              Promeni status
            </Btn>
          </>
        }
      />

      <div className={s.cols}>
        <div className={s.stack}>
          <Card title="Proizvodi" flush>
            <div style={{ overflowX: 'auto' }}>
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th>Proizvod</th>
                    <th className={ui.num}>Cena</th>
                    <th className={ui.num}>Kol.</th>
                    <th className={ui.num}>Ukupno</th>
                    <th className={ui.num}>Provizija</th>
                  </tr>
                </thead>
                <tbody>
                  {o.items.map((i) => (
                    <tr key={i.id} className={i.product_id ? ui.clickable : undefined} onClick={() => i.product_id && openProduct(i.product_id)}>
                      <td>
                        <div className={ui.cellTitle}>{i.name}</div>
                        <div className={ui.cellSub}>{i.sku}</div>
                      </td>
                      <td className={ui.num}>{rsd(i.unit_price)}</td>
                      <td className={ui.num}>{i.quantity}</td>
                      <td className={ui.num}>{rsd(i.line_total)}</td>
                      <td className={ui.num}>
                        {money2(i.commission_amount)}
                        <div className={ui.cellSub}>{pct(i.commission_pct)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={s.totals}>
              <span>
                Ukupno za proizvode: <strong>{rsd(o.items_total)}</strong>
              </span>
              <span>
                Provizija: <strong>{money2(o.commission_total)}</strong>
              </span>
            </div>
            <p style={{ margin: 0, padding: '0 12px 12px', fontSize: 12, color: 'var(--vn-color-text-muted)', textAlign: 'right' }}>
              Cene i provizija su sačuvane u trenutku porudžbine. Dostavu kupac plaća kuriru.
            </p>
          </Card>

          <Card title="Istorija statusa">
            <ol className={s.timeline}>
              {data.history.map((h) => (
                <li key={h.id}>
                  <div>
                    <strong>{orderStatusLabel[h.to_status]}</strong>
                    <small>
                      {dateTime(h.changed_at)}
                      {h.note ? ` · ${h.note}` : ''}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card title="Emailovi za ovu porudžbinu" flush>
            {data.emails.length ? (
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Primalac</th>
                    <th>Vreme</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.emails.map((e) => (
                    <tr key={e.id}>
                      <td>{templateLabel[e.template] ?? e.template}</td>
                      <td>{e.recipient}</td>
                      <td className={ui.nowrap}>{dateTime(e.created_at)}</td>
                      <td>
                        {e.status === 'sent' ? <Pill tone="success">Poslat</Pill> : e.status === 'failed' ? <Pill tone="error">Greška</Pill> : <Pill tone="info">U redu</Pill>}
                        {e.error && <div className={ui.cellSub}>{e.error}</div>}
                      </td>
                      <td className={ui.right}>
                        <Btn size="sm" icon="send" disabled title="Ponovno slanje radi kada izaberemo servis za slanje emailova (VODANATURA-62).">
                          Pošalji ponovo
                        </Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ padding: '0 20px 20px', margin: 0 }} className={ui.muted}>
                Nema poslatih emailova.
              </p>
            )}
          </Card>
        </div>

        <div className={s.stack}>
          <Card title="Kupac" extra={o.email && <a href={href('kupci', o.email.toLowerCase())} className={ui.small}>Svi njegovi nalozi</a>}>
            <dl className={ui.dl}>
              <dt>Ime i prezime</dt>
              <dd>
                {o.first_name} {o.last_name}
              </dd>
              <dt>Adresa</dt>
              <dd>
                {addr[0]}
                <br />
                {addr[1]}
              </dd>
              <dt>Telefon</dt>
              <dd>
                <a href={`tel:${o.phone.replace(/\s/g, '')}`}>{o.phone}</a>
              </dd>
              <dt>Email</dt>
              <dd>{o.email ? <a href={`mailto:${o.email}`}>{o.email}</a> : '—'}</dd>
              {o.customer_note && (
                <>
                  <dt>Napomena kupca</dt>
                  <dd>{o.customer_note}</dd>
                </>
              )}
              {o.source && (
                <>
                  <dt>Izvor</dt>
                  <dd>{o.source}</dd>
                </>
              )}
            </dl>
          </Card>
          <Card title="Dostava i beleške">
            <div className={ui.stack}>
              <Field label="Kod za praćenje (BEX)" hint="Upišite ga ako vam ga DA pošalje.">
                {(fid) => <Input id={fid} value={tracking} onChange={(e) => setTracking(e.target.value)} />}
              </Field>
              <Field label="Interna beleška" hint="Vidite je samo vi.">
                {(fid) => <TextArea id={fid} value={internal} onChange={(e) => setInternal(e.target.value)} rows={3} />}
              </Field>
              <div>
                <Btn
                  variant="primary"
                  busy={busy}
                  disabled={tracking === (o.tracking_code ?? '') && internal === (o.internal_note ?? '')}
                  onClick={() => run(async () => (await api.updateOrder(o.id, { tracking_code: tracking || null, internal_note: internal || null }), reload()), 'Sačuvano')}
                >
                  Sačuvaj
                </Btn>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {statusOpen && (
        <Modal
          title="Promena statusa"
          subtitle={`${o.order_number}: sada „${orderStatusLabel[o.status]}”`}
          onClose={() => setStatusOpen(false)}
          footer={
            <>
              <Btn onClick={() => setStatusOpen(false)}>Odustani</Btn>
              <Btn variant={next === 'cancelled' ? 'danger' : 'primary'} busy={busy} disabled={!next} onClick={saveStatus}>
                Sačuvaj status
              </Btn>
            </>
          }
        >
          <div className={ui.stack}>
            <Field label="Novi status">
              {(fid) => (
                <Select id={fid} value={next} onChange={(e) => setNext(e.target.value as OrderStatus)}>
                  {options.map((st) => (
                    <option key={st} value={st}>
                      {orderStatusLabel[st]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            {next === 'delivered' && <Notice tone="info">Datum isporuke se čuva automatski. Provizija postaje zarađena posle podešenog broja dana.</Notice>}
            {(next === 'refused' || next === 'returned' || next === 'cancelled') && <Notice tone="warning">Provizija za ovu porudžbinu biće poništena.</Notice>}
            <Field label="Napomena (opciono)" hint="Npr. šta je DA odgovorio.">
              {(fid) => <TextArea id={fid} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}
            </Field>
          </div>
        </Modal>
      )}
    </>
  );
}
