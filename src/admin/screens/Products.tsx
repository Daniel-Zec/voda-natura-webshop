import { useMemo, useState } from 'react';
import { useAdmin } from '../AdminContext';
import { CommissionModal, PriceCorrectionModal, ProductTabs, StockCell, Thumb, useCommission } from '../components/ProductBits';
import { Btn, DataTable, Empty, Loading, Modal, PageHeader, Pill, SearchInput, Select, ui, useAction, type Column } from '../components/ui';
import { categoryPath, commissionSourceLabel, money2, pct, priceModeLabel, rsd, stockLabel } from '../lib/labels';
import type { Product } from '../lib/types';
import { normalizeCode } from '../lib/stockImport';

export function Products({ initialFilter }: { initialFilter: string }) {
  const { api, catalog, reloadCatalog, openProduct, markChanged } = useAdmin();
  const commission = useCommission();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [stock, setStock] = useState('');
  const [mode, setMode] = useState(initialFilter === 'override' ? 'override' : '');
  const [vis, setVis] = useState(initialFilter === 'hidden' ? 'hidden' : initialFilter === 'notes' ? 'notes' : '');
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [modal, setModal] = useState<'price' | 'commission' | 'category' | null>(null);
  const [newCat, setNewCat] = useState('');
  const { busy, run } = useAction();

  const rows = useMemo(() => {
    if (!catalog) return [];
    const n = normalizeCode(q);
    const words = q.trim().toLowerCase();
    const inCat = (p: Product) => {
      if (!cat) return true;
      const id = Number(cat);
      return p.category_id === id || catalog.categories.find((c) => c.id === p.category_id)?.parent_id === id;
    };
    return catalog.products.filter(
      (p) =>
        inCat(p) &&
        (!stock || p.stock_state === stock) &&
        (!mode || (mode === 'override' ? p.price_mode !== 'auto' : p.price_mode === mode)) &&
        (!vis || (vis === 'visible' ? p.is_visible : vis === 'hidden' ? !p.is_visible : vis === 'featured' ? p.is_featured : vis === 'notes' ? !!p.internal.data_notes : true)) &&
        (!words || p.name.toLowerCase().includes(words) || (n && normalizeCode(p.sku).includes(n))),
    );
  }, [catalog, q, cat, stock, mode, vis]);

  if (!catalog) return <Loading />;
  const selProducts = catalog.products.filter((p) => selected.has(p.id));
  const done = async () => {
    setModal(null);
    await reloadCatalog();
  };

  const columns: Column<Product>[] = [
    { key: 'img', header: '', render: (p) => <Thumb p={p} />, width: 52 },
    {
      key: 'name',
      header: 'Proizvod',
      render: (p) => (
        <>
          <div className={ui.cellTitle}>{p.name}</div>
          <div className={ui.cellSub}>
            {p.sku}
            {p.internal.data_notes && <span className={ui.warnText}> · napomena o podacima</span>}
          </div>
        </>
      ),
      sort: (p) => p.name,
    },
    { key: 'cat', header: 'Kategorija', render: (p) => <span className={ui.small}>{categoryPath(catalog.categories, p.category_id)}</span>, sort: (p) => categoryPath(catalog.categories, p.category_id) },
    { key: 'stock', header: 'Zalihe', render: (p) => <StockCell p={p} />, sort: (p) => p.stock_qty ?? -1 },
    { key: 'da', header: 'Cena DA', num: true, render: (p) => <span className={ui.nowrap}>{rsd(p.partner_price)}</span>, sort: (p) => p.partner_price },
    {
      key: 'sale',
      header: 'Prodajna',
      num: true,
      render: (p) => (
        <>
          <span className={`${ui.nowrap} ${ui.strong}`}>{rsd(p.sale_price)}</span>
          {p.price_mode !== 'auto' && (
            <div className={ui.cellSub}>
              <Pill tone="warning" dot={false}>
                {priceModeLabel[p.price_mode]}
                {p.price_mode === 'percent' ? ` ${p.price_override} %` : ''}
              </Pill>
            </div>
          )}
        </>
      ),
      sort: (p) => p.sale_price,
    },
    {
      key: 'comm',
      header: 'Provizija',
      num: true,
      render: (p) => {
        const c = commission(p);
        return (
          <>
            <span className={ui.nowrap}>{c.pct === null ? 'nije uneto' : `${pct(c.pct)} · ${money2((p.sale_price * c.pct) / 100)}`}</span>
            <div className={ui.cellSub}>{commissionSourceLabel[c.source]}</div>
          </>
        );
      },
      sort: (p) => commission(p).pct ?? -1,
    },
    { key: 'vis', header: 'Status', render: (p) => (p.is_visible ? <Pill tone="success">Vidljiv</Pill> : <Pill tone="neutral">Sakriven</Pill>), sort: (p) => (p.is_visible ? 1 : 0) },
  ];

  const topCats = catalog.categories.filter((c) => !c.parent_id || catalog.categories.some((x) => x.id === c.parent_id && !x.parent_id));

  return (
    <>
      <PageHeader title="Proizvodi" subtitle="Kliknite na proizvod za izmenu. Izaberite više proizvoda za grupne izmene." />
      <ProductTabs active="list" />
      <div className={ui.toolbar}>
        <SearchInput value={q} onChange={setQ} placeholder="Naziv ili šifra (npr. BL 10)" />
        <Select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Kategorija">
          <option value="">Sve kategorije</option>
          {topCats.map((c) => (
            <option key={c.id} value={c.id}>
              {categoryPath(catalog.categories, c.id)}
            </option>
          ))}
        </Select>
        <Select value={stock} onChange={(e) => setStock(e.target.value)} aria-label="Zalihe">
          <option value="">Sve zalihe</option>
          {Object.entries(stockLabel).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Select value={mode} onChange={(e) => setMode(e.target.value)} aria-label="Način cene">
          <option value="">Sve cene</option>
          <option value="auto">Auto</option>
          <option value="override">Sa korekcijom</option>
          <option value="fixed">Fiksna</option>
          <option value="percent">Procenat</option>
        </Select>
        <Select value={vis} onChange={(e) => setVis(e.target.value)} aria-label="Vidljivost">
          <option value="">Vidljivi i sakriveni</option>
          <option value="visible">Samo vidljivi</option>
          <option value="hidden">Samo sakriveni</option>
          <option value="featured">Istaknuti</option>
          <option value="notes">Sa napomenom o podacima</option>
        </Select>
      </div>
      <DataTable
        label="Proizvodi"
        rows={rows}
        columns={columns}
        rowKey={(p) => p.id}
        onRowClick={(p) => openProduct(p.id)}
        selected={selected}
        onSelectedChange={setSelected}
        pageSize={60}
        initialSort={{ key: 'name', dir: 'asc' }}
        empty={<Empty icon="box" title="Nijedan proizvod ne odgovara filterima" />}
      />
      {selected.size > 0 && (
        <div className={ui.bulkBar} role="region" aria-label="Grupne izmene">
          <strong style={{ marginRight: 8 }}>Izabrano: {selected.size}</strong>
          <Btn size="sm" icon="percent" onClick={() => setModal('commission')}>
            Provizija %
          </Btn>
          <Btn size="sm" icon="tag" onClick={() => setModal('price')}>
            Korekcija cene
          </Btn>
          <Btn
            size="sm"
            icon="undo"
            busy={busy}
            onClick={() => run(async () => (await api.setPrices([...selected].map(Number), 'auto', null, 'bulk'), markChanged(), await reloadCatalog()), 'Cene vraćene na Auto')}
          >
            Cena na Auto
          </Btn>
          <Btn size="sm" icon="eye" busy={busy} onClick={() => run(async () => (await api.setVisibility([...selected].map(Number), true), markChanged(), await reloadCatalog()), 'Prikazano u prodavnici')}>
            Prikaži
          </Btn>
          <Btn size="sm" icon="eyeOff" busy={busy} onClick={() => run(async () => (await api.setVisibility([...selected].map(Number), false), markChanged(), await reloadCatalog()), 'Sakriveno iz prodavnice')}>
            Sakrij
          </Btn>
          <Btn size="sm" icon="box" onClick={() => setModal('category')}>
            Promeni kategoriju
          </Btn>
          <span className={ui.spacer} />
          <Btn size="sm" variant="ghost" onClick={() => setSelected(new Set())} style={{ color: 'inherit' }}>
            Poništi izbor
          </Btn>
        </div>
      )}
      {modal === 'price' && <PriceCorrectionModal products={selProducts} onClose={() => setModal(null)} onDone={done} />}
      {modal === 'commission' && (
        <CommissionModal title={`Provizija za ${selected.size} proizvoda`} targets={[...selected].map((id) => ({ product_id: Number(id) }))} onClose={() => setModal(null)} onDone={done} />
      )}
      {modal === 'category' && (
        <Modal
          title={`Kategorija za ${selected.size} proizvoda`}
          onClose={() => setModal(null)}
          footer={
            <>
              <Btn onClick={() => setModal(null)}>Odustani</Btn>
              <Btn variant="primary" busy={busy} disabled={!newCat} onClick={() => run(async () => (await api.setCategory([...selected].map(Number), Number(newCat)), markChanged(), await done()), 'Kategorija promenjena')}>
                Sačuvaj
              </Btn>
            </>
          }
        >
          <Select value={newCat} onChange={(e) => setNewCat(e.target.value)} aria-label="Nova kategorija">
            <option value="">Izaberite kategoriju</option>
            {catalog.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {categoryPath(catalog.categories, c.id)}
              </option>
            ))}
          </Select>
        </Modal>
      )}
    </>
  );
}
