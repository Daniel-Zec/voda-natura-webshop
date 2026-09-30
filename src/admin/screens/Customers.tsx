import { useMemo, useState } from 'react';
import { useAdmin } from '../AdminContext';
import { Btn, DataTable, Empty, Loading, Notice, PageHeader, SearchInput, ui, useLoad, type Column } from '../components/ui';
import { date, downloadCsv, rsd } from '../lib/labels';
import type { Customer } from '../lib/types';
import { go } from '../router';

export function Customers() {
  const { api } = useAdmin();
  const { data, error } = useLoad(() => api.listCustomers(), [api]);
  const [q, setQ] = useState('');
  const [repeat, setRepeat] = useState(false);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase().replace(/\s/g, '');
    return (data ?? []).filter(
      (c) => (!repeat || c.orders_count > 1) && (!n || [c.name, c.email, c.phone, c.city].some((v) => (v ?? '').toLowerCase().replace(/\s/g, '').includes(n))),
    );
  }, [data, q, repeat]);

  const columns: Column<Customer>[] = [
    { key: 'name', header: 'Kupac', render: (c) => (<><div className={ui.cellTitle}>{c.name}</div><div className={ui.cellSub}>{c.email}</div></>), sort: (c) => c.name },
    { key: 'phone', header: 'Telefon', render: (c) => <span className={ui.nowrap}>{c.phone}</span> },
    { key: 'city', header: 'Grad', render: (c) => c.city, sort: (c) => c.city },
    { key: 'orders', header: 'Porudžbine', num: true, render: (c) => c.orders_count, sort: (c) => c.orders_count },
    { key: 'total', header: 'Ukupno poručeno', num: true, render: (c) => <span className={ui.nowrap}>{rsd(c.total_ordered)}</span>, sort: (c) => c.total_ordered },
    { key: 'last', header: 'Poslednja', render: (c) => date(c.last_order_at), sort: (c) => c.last_order_at },
  ];

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data) return <Loading />;
  return (
    <>
      <PageHeader
        title="Kupci"
        subtitle="Kupci se prave iz porudžbina (kupovina bez naloga), spojeni po email adresi."
        actions={
          <Btn
            icon="download"
            disabled={!rows.length}
            onClick={() =>
              downloadCsv('kupci.csv', [
                ['Ime', 'Email', 'Telefon', 'Grad', 'Porudžbine', 'Ukupno RSD', 'Prva', 'Poslednja'],
                ...rows.map((c) => [c.name, c.email, c.phone, c.city, c.orders_count, c.total_ordered, date(c.first_order_at), date(c.last_order_at)]),
              ])
            }
          >
            Izvoz CSV
          </Btn>
        }
      />
      <div className={ui.toolbar}>
        <SearchInput value={q} onChange={setQ} placeholder="Ime, email, telefon ili grad" />
        <label className={ui.check}>
          <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} /> Samo kupci sa više porudžbina
        </label>
      </div>
      <DataTable
        label="Kupci"
        rows={rows}
        columns={columns}
        rowKey={(c) => c.email}
        onRowClick={(c) => go('kupci', c.email)}
        initialSort={{ key: 'last', dir: 'desc' }}
        empty={<Empty icon="users" title="Još nema kupaca" />}
      />
    </>
  );
}
