import { useMemo, useState } from 'react';
import { useAdmin } from '../AdminContext';
import { Btn, DataTable, Empty, Input, Loading, Notice, PageHeader, Pill, SearchInput, Select, ui, useLoad, type Column } from '../components/ui';
import { date, dateTime, downloadCsv, orderStatuses, orderStatusLabel, orderStatusTone, rsd } from '../lib/labels';
import type { EmailLogRow, Order } from '../lib/types';
import { go } from '../router';

export function Orders({ initialStatus }: { initialStatus: string }) {
  const { api } = useAdmin();
  const { data, error } = useLoad(async () => {
    const [orders, emails] = await Promise.all([api.listOrders(), api.listEmailLog()]);
    return { orders, emails };
  }, [api]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const mailStatus = useMemo(() => {
    const m = new Map<number, EmailLogRow['status'] | 'none'>();
    for (const e of data?.emails ?? []) {
      if (e.template !== 'order_to_partner' || e.order_id === null) continue;
      const prev = m.get(e.order_id);
      if (prev !== 'sent') m.set(e.order_id, e.status);
    }
    return m;
  }, [data]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase().replace(/\s/g, '');
    return (data?.orders ?? []).filter((o) => {
      if (status && o.status !== status) return false;
      if (from && o.created_at < from) return false;
      if (to && o.created_at.slice(0, 10) > to) return false;
      if (!needle) return true;
      return [o.order_number, `${o.first_name}${o.last_name}`, o.phone, o.email, o.city].some((v) => v.toLowerCase().replace(/\s/g, '').includes(needle));
    });
  }, [data, q, status, from, to]);

  const columns: Column<Order>[] = [
    { key: 'nr', header: 'Broj', render: (o) => <span className={ui.cellTitle}>{o.order_number}</span>, sort: (o) => o.order_number },
    { key: 'date', header: 'Datum', render: (o) => <span className={ui.nowrap}>{dateTime(o.created_at)}</span>, sort: (o) => o.created_at },
    {
      key: 'customer',
      header: 'Kupac',
      render: (o) => (
        <>
          <div className={ui.cellTitle}>
            {o.first_name} {o.last_name}
          </div>
          <div className={ui.cellSub}>{o.phone}</div>
        </>
      ),
      sort: (o) => `${o.last_name} ${o.first_name}`,
    },
    { key: 'city', header: 'Grad', render: (o) => o.city, sort: (o) => o.city },
    { key: 'total', header: 'Ukupno', num: true, render: (o) => <span className={ui.nowrap}>{rsd(o.items_total)}</span>, sort: (o) => o.items_total },
    { key: 'status', header: 'Status', render: (o) => <Pill tone={orderStatusTone[o.status]}>{orderStatusLabel[o.status]}</Pill>, sort: (o) => orderStatuses.indexOf(o.status) },
    {
      key: 'mail',
      header: 'Email DA',
      render: (o) => {
        const m = mailStatus.get(o.id) ?? 'none';
        return m === 'sent' ? <Pill tone="success">Poslat</Pill> : m === 'failed' ? <Pill tone="error">Greška</Pill> : m === 'queued' ? <Pill tone="info">U redu</Pill> : <Pill tone="warning">Nije poslat</Pill>;
      },
    },
  ];

  const exportCsv = () =>
    downloadCsv(`porudzbine-${date(new Date().toISOString())}.csv`, [
      ['Broj', 'Datum', 'Ime', 'Prezime', 'Telefon', 'Email', 'Grad', 'Ukupno RSD', 'Status', 'Provizija RSD'],
      ...rows.map((o) => [o.order_number, dateTime(o.created_at), o.first_name, o.last_name, o.phone, o.email, o.city, o.items_total, orderStatusLabel[o.status], o.commission_total]),
    ]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data) return <Loading />;
  return (
    <>
      <PageHeader title="Porudžbine" subtitle="Status menjate ručno, prema odgovorima DA na email porudžbine." actions={<Btn icon="download" onClick={exportCsv} disabled={!rows.length}>Izvoz CSV</Btn>} />
      <div className={ui.toolbar}>
        <SearchInput value={q} onChange={setQ} placeholder="Broj, ime, telefon ili email" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">Svi statusi</option>
          {orderStatuses.map((st) => (
            <option key={st} value={st}>
              {orderStatusLabel[st]} ({data.orders.filter((o) => o.status === st).length})
            </option>
          ))}
        </Select>
        <Input type="date" aria-label="Od datuma" value={from} onChange={(e) => setFrom(e.target.value)} style={{ width: 'auto' }} />
        <Input type="date" aria-label="Do datuma" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: 'auto' }} />
        {(q || status || from || to) && (
          <Btn variant="ghost" size="sm" icon="close" onClick={() => (setQ(''), setStatus(''), setFrom(''), setTo(''))}>
            Poništi filtere
          </Btn>
        )}
      </div>
      <DataTable
        label="Porudžbine"
        rows={rows}
        columns={columns}
        rowKey={(o) => o.id}
        onRowClick={(o) => go('porudzbine', o.id)}
        initialSort={{ key: 'date', dir: 'desc' }}
        empty={
          <Empty icon="orders" title={data.orders.length ? 'Nijedna porudžbina ne odgovara filterima' : 'Još nema porudžbina'}>
            {data.orders.length ? null : 'Porudžbine će se pojaviti ovde kada checkout bude uključen.'}
          </Empty>
        }
      />
    </>
  );
}
