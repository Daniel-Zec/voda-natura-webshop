import { useMemo, useState } from 'react';
import { useAdmin } from '../AdminContext';
import { PeriodPicker } from '../components/PeriodPicker';
import { Btn, DataTable, Empty, Kpi, Loading, Notice, PageHeader, Pill, Select, Tabs, ui, useLoad, type Column } from '../components/ui';
import { commissionStatusLabel, commissionStatusTone, date, downloadCsv, money2, pct, rsd, settingNumber } from '../lib/labels';
import { inPeriod, periodFor, periodLabels, type PeriodKey } from '../lib/period';
import type { CommissionLine } from '../lib/types';
import { go, href } from '../router';
import s from './screens.module.css';

export function CommissionTabs({ active }: { active: 'summary' | 'rates' }) {
  return (
    <Tabs
      active={active}
      items={[
        { id: 'summary', label: 'Pregled provizije', href: href('provizija') },
        { id: 'rates', label: 'Stope provizije', href: href('provizija', 'stope') },
      ]}
    />
  );
}

export function CommissionSummary() {
  const { api, catalog } = useAdmin();
  const { data, error } = useLoad(async () => {
    const [lines, orders] = await Promise.all([api.listCommissionLines(), api.listOrders()]);
    const productOf = new Map<number, number | null>();
    for (const o of orders) for (const i of o.items) productOf.set(i.id, i.product_id);
    return { lines, productOf };
  }, [api]);
  const [key, setKey] = useState<PeriodKey>('month');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [group, setGroup] = useState<'lines' | 'product' | 'category'>('lines');
  const [status, setStatus] = useState('');
  const period = periodFor(key, custom);

  const lines = useMemo(() => (data?.lines ?? []).filter((l) => inPeriod(l.ordered_at, period) && (!status || l.commission_status === status)), [data, period.from.getTime(), period.to.getTime(), status]);
  const all = useMemo(() => (data?.lines ?? []).filter((l) => inPeriod(l.ordered_at, period)), [data, period.from.getTime(), period.to.getTime()]);
  const sum = (st: CommissionLine['commission_status']) => {
    const ls = all.filter((l) => l.commission_status === st);
    return { commission: ls.reduce((x, l) => x + l.commission_amount, 0), value: ls.reduce((x, l) => x + l.line_total, 0), count: new Set(ls.map((l) => l.order_id)).size };
  };

  const grouped = useMemo(() => {
    if (group === 'lines' || !catalog || !data) return [];
    const m = new Map<string, { key: string; name: string; qty: number; value: number; commission: number; earned: number }>();
    for (const l of lines) {
      const pid = data.productOf.get(l.order_item_id) ?? null;
      const p = pid ? catalog.products.find((x) => x.id === pid) : undefined;
      let k = l.sku;
      let name = l.name;
      if (group === 'category') {
        const c = catalog.categories.find((x) => x.id === p?.category_id);
        const top = c?.parent_id ? catalog.categories.find((x) => x.id === c.parent_id) : c;
        k = String(top?.id ?? 'none');
        name = top?.name ?? 'Bez kategorije';
      }
      const g = m.get(k) ?? { key: k, name, qty: 0, value: 0, commission: 0, earned: 0 };
      g.qty += l.quantity;
      g.value += l.line_total;
      if (l.commission_status !== 'cancelled') g.commission += l.commission_amount;
      if (l.commission_status === 'earned') g.earned += l.commission_amount;
      m.set(k, g);
    }
    return [...m.values()];
  }, [lines, group, catalog, data]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data || !catalog) return <Loading />;
  const earned = sum('earned');
  const pending = sum('pending');
  const cancelled = sum('cancelled');
  const earnDays = settingNumber(catalog.settings, 'commission_earn_days', 7);

  const lineCols: Column<CommissionLine>[] = [
    { key: 'nr', header: 'Porudžbina', render: (l) => <span className={`${ui.cellTitle} ${ui.nowrap}`}>{l.order_number}</span>, sort: (l) => l.order_number },
    { key: 'od', header: 'Poručeno', render: (l) => date(l.ordered_at), sort: (l) => l.ordered_at },
    { key: 'dd', header: 'Isporučeno', render: (l) => date(l.delivered_at), sort: (l) => l.delivered_at },
    { key: 'p', header: 'Proizvod', render: (l) => (<><div>{l.name}</div><div className={ui.cellSub}>{l.sku}</div></>), sort: (l) => l.name },
    { key: 'q', header: 'Kol.', num: true, render: (l) => l.quantity },
    { key: 't', header: 'Iznos', num: true, render: (l) => <span className={ui.nowrap}>{rsd(l.line_total)}</span>, sort: (l) => l.line_total },
    { key: 'pc', header: '%', num: true, render: (l) => pct(l.commission_pct) },
    { key: 'c', header: 'Provizija', num: true, render: (l) => <strong className={ui.nowrap}>{money2(l.commission_amount)}</strong>, sort: (l) => l.commission_amount },
    { key: 's', header: 'Status', render: (l) => <Pill tone={commissionStatusTone[l.commission_status]}>{commissionStatusLabel[l.commission_status]}</Pill>, sort: (l) => l.commission_status },
  ];

  const exportCsv = () =>
    downloadCsv(`provizija-${periodLabels[key].toLowerCase().replace(/\s/g, '-')}.csv`, [
      ['Porudžbina', 'Poručeno', 'Isporučeno', 'Šifra', 'Proizvod', 'Količina', 'Iznos RSD', 'Provizija %', 'Provizija RSD', 'Status'],
      ...lines.map((l) => [l.order_number, date(l.ordered_at), date(l.delivered_at), l.sku, l.name, l.quantity, l.line_total, l.commission_pct, l.commission_amount, commissionStatusLabel[l.commission_status]]),
    ]);

  return (
    <>
      <PageHeader
        title="Provizija"
        subtitle={`Zarađeno = isporučeno pre najmanje ${earnDays} dana. Bez faktura: izvezite spisak i uporedite sa DA.`}
        actions={
          <>
            <PeriodPicker value={key} onChange={setKey} custom={custom} onCustom={setCustom} options={['month', 'lastMonth', '30', 'custom']} />
            <Btn icon="download" onClick={exportCsv} disabled={!lines.length}>
              Izvoz CSV
            </Btn>
          </>
        }
      />
      <CommissionTabs active="summary" />
      <div className={s.kpis}>
        <Kpi label="Zarađeno" value={rsd(Math.round(earned.commission))} hint={`${earned.count} porudžb. · ${rsd(earned.value)}`} />
        <Kpi label="Na čekanju" value={rsd(Math.round(pending.commission))} hint={`${pending.count} porudžb. · ${rsd(pending.value)}`} />
        <Kpi label="Poništeno" value={rsd(Math.round(cancelled.commission))} hint={`${cancelled.count} porudžb. (otkazano, odbijeno, vraćeno)`} />
      </div>
      <div className={ui.toolbar}>
        <Select value={group} onChange={(e) => setGroup(e.target.value as typeof group)} aria-label="Grupisanje">
          <option value="lines">Po stavkama porudžbina</option>
          <option value="product">Po proizvodu</option>
          <option value="category">Po kategoriji</option>
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status provizije">
          <option value="">Svi statusi</option>
          <option value="earned">Zarađeno</option>
          <option value="pending">Na čekanju</option>
          <option value="cancelled">Poništeno</option>
        </Select>
      </div>
      {group === 'lines' ? (
        <DataTable label="Stavke provizije" rows={lines} columns={lineCols} rowKey={(l) => l.order_item_id} onRowClick={(l) => go('porudzbine', l.order_id)} initialSort={{ key: 'od', dir: 'desc' }} empty={<Empty icon="percent" title="Nema provizije u ovom periodu" />} />
      ) : (
        <DataTable
          label="Provizija grupisano"
          rows={grouped}
          rowKey={(g) => g.key}
          initialSort={{ key: 'c', dir: 'desc' }}
          columns={[
            { key: 'n', header: group === 'product' ? 'Proizvod' : 'Kategorija', render: (g) => <span className={ui.cellTitle}>{g.name}</span>, sort: (g) => g.name },
            { key: 'q', header: 'Komada', num: true, render: (g) => g.qty, sort: (g) => g.qty },
            { key: 'v', header: 'Iznos', num: true, render: (g) => rsd(g.value), sort: (g) => g.value },
            { key: 'c', header: 'Provizija (bez poništene)', num: true, render: (g) => <strong>{money2(g.commission)}</strong>, sort: (g) => g.commission },
            { key: 'e', header: 'Od toga zarađeno', num: true, render: (g) => money2(g.earned), sort: (g) => g.earned },
          ]}
          empty={<Empty icon="percent" title="Nema provizije u ovom periodu" />}
        />
      )}
      <p className={ui.small} style={{ color: 'var(--vn-color-text-muted)' }}>
        Otvoreno sa DA: šta se dešava sa provizijom za odbijene i vraćene pakete (VODANATURA-26). Za sada se računaju kao poništene.
      </p>
    </>
  );
}
