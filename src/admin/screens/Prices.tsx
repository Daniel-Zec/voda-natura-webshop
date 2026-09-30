import { useMemo, useState } from 'react';
import { useAdmin } from '../AdminContext';
import { PriceCorrectionModal, ProductTabs, Thumb } from '../components/ProductBits';
import { Btn, Card, DataTable, Empty, Loading, Notice, PageHeader, Pill, SearchInput, Select, ui, useAction, type Column } from '../components/ui';
import { categoryPath, dateTime, priceModeLabel, rsd } from '../lib/labels';
import type { Product } from '../lib/types';
import s from './screens.module.css';

export function Prices() {
  const { api, catalog, reloadCatalog, openProduct, markChanged } = useAdmin();
  const initial = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('filter') === 'override' ? 'override' : '';
  const [filter, setFilter] = useState(initial);
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [modal, setModal] = useState<Product[] | null>(null);
  const { busy, run } = useAction();

  const rows = useMemo(() => {
    if (!catalog) return [];
    const n = q.trim().toLowerCase();
    return catalog.products.filter(
      (p) =>
        (!filter || (filter === 'override' ? p.price_mode !== 'auto' : p.price_mode === filter)) &&
        (!cat || p.category_id === Number(cat) || catalog.categories.find((c) => c.id === p.category_id)?.parent_id === Number(cat)) &&
        (!n || p.name.toLowerCase().includes(n) || p.sku.toLowerCase().includes(n)),
    );
  }, [catalog, filter, cat, q]);

  if (!catalog) return <Loading />;
  const sync = catalog.settings.price_sync_status as { ok?: boolean; changed?: number; unmatched?: string[] } | null;
  const lastRun = catalog.settings.price_sync_last_run as string | null;
  const overrides = catalog.products.filter((p) => p.price_mode !== 'auto').length;

  const columns: Column<Product>[] = [
    { key: 'img', header: '', render: (p) => <Thumb p={p} />, width: 52 },
    { key: 'name', header: 'Proizvod', render: (p) => (<><div className={ui.cellTitle}>{p.name}</div><div className={ui.cellSub}>{p.sku}</div></>), sort: (p) => p.name },
    { key: 'da', header: 'Cena DA', num: true, render: (p) => rsd(p.partner_price), sort: (p) => p.partner_price },
    {
      key: 'mode',
      header: 'Način',
      render: (p) => (p.price_mode === 'auto' ? <Pill tone="neutral">Auto</Pill> : <Pill tone="warning">{priceModeLabel[p.price_mode]}{p.price_mode === 'percent' ? ` ${p.price_override} %` : ''}</Pill>),
      sort: (p) => p.price_mode,
    },
    { key: 'sale', header: 'Prodajna', num: true, render: (p) => <strong>{rsd(p.sale_price)}</strong>, sort: (p) => p.sale_price },
    { key: 'diff', header: 'Razlika', num: true, render: (p) => (p.sale_price === p.partner_price ? '—' : <span className={p.sale_price > p.partner_price ? ui.warnText : ui.brand}>{p.sale_price > p.partner_price ? '+' : ''}{rsd(p.sale_price - p.partner_price)}</span>), sort: (p) => p.sale_price - p.partner_price },
    {
      key: 'act',
      header: '',
      render: (p) => (
        <span className={ui.row} style={{ gap: 4, flexWrap: 'nowrap' }}>
          <Btn size="sm" icon="tag" onClick={() => setModal([p])}>
            Ispravi
          </Btn>
          {p.price_mode !== 'auto' && (
            <Btn size="sm" variant="ghost" icon="undo" busy={busy} onClick={() => run(async () => (await api.setPrices([p.id], 'auto', null, 'manual'), markChanged(), await reloadCatalog()), 'Vraćeno na Auto')}>
              Auto
            </Btn>
          )}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Proizvodi" subtitle="Cene dolaze sa decorambient.com (sa PDV-om). Korekcija je samo za ispravku greške." />
      <ProductTabs active="prices" />
      <div className={s.cols} style={{ marginBottom: 20 }}>
        <Card title="Automatsko čitanje cena">
          {lastRun ? (
            <dl className={ui.dl}>
              <dt>Poslednje čitanje</dt>
              <dd>{dateTime(lastRun)}</dd>
              <dt>Status</dt>
              <dd>{sync?.ok ? <Pill tone="success">Uspešno</Pill> : <Pill tone="error">Neuspešno</Pill>}</dd>
              <dt>Promenjenih cena</dt>
              <dd>{sync?.changed ?? 0}</dd>
              <dt>Nepovezani proizvodi</dt>
              <dd>{sync?.unmatched?.length ? sync.unmatched.join(', ') : 'nema'}</dd>
            </dl>
          ) : (
            <Notice tone="info">
              Dnevno čitanje cena sa decorambient.com <strong>još nije uključeno</strong> (Jira VODANATURA-71). Do tada važe cene iz uvoza kataloga od 29.09.2026. Raspored: jednom dnevno.
            </Notice>
          )}
        </Card>
        <Card title="Korekcije">
          <p style={{ margin: 0 }}>
            <strong style={{ fontSize: 22 }}>{overrides}</strong> proizvod{overrides === 1 ? '' : 'a'} sa ručnom korekcijom.
          </p>
          <p className={ui.small} style={{ color: 'var(--vn-color-text-secondary)' }}>
            Kad DA ispravi cenu na svom sajtu, vratite proizvod na Auto. Svaka promena se beleži u istoriji cene.
          </p>
          {overrides > 0 && (
            <Btn size="sm" onClick={() => setFilter('override')}>
              Prikaži korekcije
            </Btn>
          )}
        </Card>
      </div>
      <div className={ui.toolbar}>
        <SearchInput value={q} onChange={setQ} placeholder="Naziv ili šifra" />
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Način">
          <option value="">Sve cene</option>
          <option value="override">Sa korekcijom</option>
          <option value="auto">Auto</option>
        </Select>
        <Select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Kategorija">
          <option value="">Sve kategorije</option>
          {catalog.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {categoryPath(catalog.categories, c.id)}
            </option>
          ))}
        </Select>
        <span className={ui.spacer} />
        <Btn icon="tag" disabled={!rows.length} onClick={() => setModal(selected.size ? catalog.products.filter((p) => selected.has(p.id)) : rows)}>
          {selected.size ? `Ispravi izabrane (${selected.size})` : `Ispravi sve prikazane (${rows.length})`}
        </Btn>
      </div>
      <DataTable
        label="Cene"
        rows={rows}
        columns={columns}
        rowKey={(p) => p.id}
        selected={selected}
        onSelectedChange={setSelected}
        onRowClick={(p) => openProduct(p.id)}
        initialSort={{ key: 'name', dir: 'asc' }}
        pageSize={60}
        empty={<Empty icon="tag" title="Nema proizvoda za ove filtere" />}
      />
      {modal && <PriceCorrectionModal products={modal} onClose={() => setModal(null)} onDone={async () => (setModal(null), setSelected(new Set()), await reloadCatalog())} />}
    </>
  );
}
