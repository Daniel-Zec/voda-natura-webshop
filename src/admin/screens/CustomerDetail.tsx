import { useState } from 'react';
import { useAdmin } from '../AdminContext';
import { Btn, Card, DataTable, Loading, Modal, Notice, PageHeader, Pill, ui, useAction, useLoad } from '../components/ui';
import { date, dateTime, downloadCsv, orderStatusLabel, orderStatusTone, rsd } from '../lib/labels';
import { go, href } from '../router';
import s from './screens.module.css';

export function CustomerDetail({ email }: { email: string }) {
  const { api } = useAdmin();
  const { data, error } = useLoad(async () => {
    const [customers, orders] = await Promise.all([api.listCustomers(), api.listOrders()]);
    return { customer: customers.find((c) => c.email === email.toLowerCase()) ?? null, orders: orders.filter((o) => o.email.toLowerCase() === email.toLowerCase()) };
  }, [api, email]);
  const [confirm, setConfirm] = useState(false);
  const { busy, run } = useAction();

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data) return <Loading />;
  const c = data.customer;
  if (!c) return <Notice tone="warning">Kupac ne postoji (možda su podaci obrisani). <a href={href('kupci')}>Nazad na listu</a>.</Notice>;
  const last = data.orders[0];

  const exportData = () =>
    downloadCsv(`podaci-${c.email}.csv`, [
      ['Porudžbina', 'Datum', 'Ime', 'Prezime', 'Ulica', 'Broj', 'Stan', 'Grad', 'Poštanski broj', 'Telefon', 'Email', 'Napomena', 'Proizvodi', 'Ukupno RSD', 'Status'],
      ...data.orders.map((o) => [o.order_number, dateTime(o.created_at), o.first_name, o.last_name, o.street, o.house_number, o.apartment, o.city, o.postal_code, o.phone, o.email, o.customer_note, o.items.map((i) => `${i.quantity}× ${i.sku}`).join(', '), o.items_total, orderStatusLabel[o.status]]),
    ]);

  return (
    <>
      <PageHeader
        back={{ href: href('kupci'), label: 'Kupci' }}
        title={c.name}
        subtitle={`${c.orders_count} porudžb. · ukupno ${rsd(c.total_ordered)} · kupac od ${date(c.first_order_at)}`}
        actions={
          <>
            <Btn icon="download" onClick={exportData}>
              Izvoz podataka
            </Btn>
            <Btn variant="danger" icon="trash" onClick={() => setConfirm(true)}>
              Obriši lične podatke
            </Btn>
          </>
        }
      />
      <div className={s.cols}>
        <DataTable
          label="Porudžbine kupca"
          rows={data.orders}
          rowKey={(o) => o.id}
          onRowClick={(o) => go('porudzbine', o.id)}
          columns={[
            { key: 'nr', header: 'Broj', render: (o) => <span className={ui.cellTitle}>{o.order_number}</span> },
            { key: 'date', header: 'Datum', render: (o) => date(o.created_at) },
            { key: 'items', header: 'Proizvodi', render: (o) => o.items.map((i) => `${i.quantity}× ${i.sku}`).join(', ') },
            { key: 'total', header: 'Ukupno', num: true, render: (o) => rsd(o.items_total) },
            { key: 'status', header: 'Status', render: (o) => <Pill tone={orderStatusTone[o.status]}>{orderStatusLabel[o.status]}</Pill> },
          ]}
        />
        <Card title="Kontakt">
          <dl className={ui.dl}>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${c.email}`}>{c.email}</a>
            </dd>
            <dt>Telefon</dt>
            <dd>
              <a href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a>
            </dd>
            {last && (
              <>
                <dt>Poslednja adresa</dt>
                <dd>
                  {last.street} {last.house_number}
                  {last.apartment ? `, stan ${last.apartment}` : ''}
                  <br />
                  {last.postal_code} {last.city}
                </dd>
              </>
            )}
          </dl>
        </Card>
      </div>
      {confirm && (
        <Modal
          title="Obrisati lične podatke?"
          onClose={() => setConfirm(false)}
          footer={
            <>
              <Btn onClick={() => setConfirm(false)}>Odustani</Btn>
              <Btn
                variant="danger"
                busy={busy}
                onClick={() =>
                  run(async () => {
                    await api.anonymizeCustomer(c.email);
                    go('kupci');
                  }, 'Lični podaci su obrisani')
                }
              >
                Obriši
              </Btn>
            </>
          }
        >
          <p style={{ margin: 0 }}>
            Ime, adresa, telefon i email biće obrisani iz {data.orders.length} porudžbin{data.orders.length === 1 ? 'e' : 'a'}. Porudžbine, proizvodi i provizija ostaju. Ovo se ne može
            vratiti. Pre brisanja možete izvesti podatke za kupca.
          </p>
        </Modal>
      )}
    </>
  );
}
