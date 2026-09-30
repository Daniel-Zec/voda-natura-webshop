import { useMemo, useState } from 'react';
import { useAdmin } from '../AdminContext';
import { CommissionModal } from '../components/ProductBits';
import { Btn, Card, DataTable, Field, Input, Loading, Notice, PageHeader, Pill, SearchInput, Select, ui, useAction } from '../components/ui';
import { categoryPath, commissionFor, commissionSourceLabel, money2, pct } from '../lib/labels';
import type { Category } from '../lib/types';
import { CommissionTabs } from './CommissionSummary';
import s from './screens.module.css';

export function CommissionRates() {
  const { api, catalog, reloadCatalog } = useAdmin();
  const [def, setDef] = useState<string | null>(null);
  const [modal, setModal] = useState<{ title: string; targets: ({ category_id: number } | { product_id: number })[] } | null>(null);
  const [q, setQ] = useState('');
  const [src, setSrc] = useState('');
  const { busy, run } = useAction();

  const products = useMemo(() => {
    if (!catalog) return [];
    const n = q.trim().toLowerCase();
    return catalog.products
      .map((p) => ({ p, c: commissionFor(catalog, p) }))
      .filter(({ p, c }) => (!n || p.name.toLowerCase().includes(n) || p.sku.toLowerCase().includes(n)) && (!src || c.source === src));
  }, [catalog, q, src]);

  if (!catalog) return <Loading />;
  const current = catalog.settings.commission_default_pct;
  const defValue = def ?? (current === null || current === undefined ? '' : String(current));
  const ruleFor = (c: Category) => catalog.rules.find((r) => r.category_id === c.id);
  const cats = [...catalog.categories].sort((a, b) => categoryPath(catalog.categories, a.id).localeCompare(categoryPath(catalog.categories, b.id), 'sr'));

  return (
    <>
      <PageHeader title="Provizija" subtitle="Važi najpreciznija stopa: proizvod → kategorija → nadkategorija → podrazumevana. Promene važe samo za nove porudžbine." />
      <CommissionTabs active="rates" />
      <div className={s.cols}>
        <Card title="Stope po kategoriji" flush>
          <DataTable
            label="Stope po kategoriji"
            rows={cats}
            rowKey={(c) => c.id}
            pageSize={100}
            columns={[
              { key: 'n', header: 'Kategorija', render: (c) => <span className={c.parent_id ? undefined : ui.strong}>{categoryPath(catalog.categories, c.id)}</span> },
              { key: 'p', header: 'Proizvoda', num: true, render: (c) => catalog.products.filter((p) => p.category_id === c.id).length },
              { key: 'r', header: 'Stopa', num: true, render: (c) => (ruleFor(c) ? <strong>{pct(ruleFor(c)!.pct)}</strong> : <span className={ui.muted}>nasleđuje</span>) },
              {
                key: 'a',
                header: '',
                render: (c) => (
                  <Btn size="sm" onClick={() => setModal({ title: `Provizija: ${c.name}`, targets: [{ category_id: c.id }] })}>
                    {ruleFor(c) ? 'Izmeni' : 'Postavi'}
                  </Btn>
                ),
              },
            ]}
          />
        </Card>
        <Card title="Podrazumevana provizija">
          <div className={ui.stack}>
            {(current === null || current === undefined) && <Notice tone="warning">Procenat još nije dogovoren sa DA (VODANATURA-23). Dok nije unet, provizija se računa kao 0.</Notice>}
            <Field label="Važi za sve proizvode bez posebne stope" hint="Popust na maloprodajnu cenu DA sa PDV-om.">
              {(id) => (
                <div className={ui.inputSuffix}>
                  <Input id={id} inputMode="decimal" value={defValue} onChange={(e) => setDef(e.target.value)} />
                  <span>%</span>
                </div>
              )}
            </Field>
            <div>
              <Btn
                variant="primary"
                busy={busy}
                disabled={def === null}
                onClick={() => {
                  const v = defValue.trim() === '' ? null : Number(defValue.replace(',', '.'));
                  if (v !== null && (!Number.isFinite(v) || v < 0 || v > 100)) return;
                  run(async () => (await api.saveSettings({ commission_default_pct: v }), setDef(null), await reloadCatalog()), 'Podrazumevana provizija sačuvana');
                }}
              >
                Sačuvaj
              </Btn>
            </div>
            <p className={ui.small} style={{ color: 'var(--vn-color-text-muted)', margin: 0 }}>
              Skupi uređaji (omekšivači, RO sistemi) imaju posebne uslove kod DA: postavite stopu na njihovoj kategoriji.
            </p>
          </div>
        </Card>
      </div>

      <h2 style={{ fontSize: 16, margin: '32px 0 12px' }}>Stopa po proizvodu</h2>
      <div className={ui.toolbar}>
        <SearchInput value={q} onChange={setQ} placeholder="Naziv ili šifra" />
        <Select value={src} onChange={(e) => setSrc(e.target.value)} aria-label="Izvor stope">
          <option value="">Svi izvori</option>
          {Object.entries(commissionSourceLabel).map(([k, v]) => (
            <option key={k} value={k}>
              Stopa iz: {v}
            </option>
          ))}
        </Select>
      </div>
      <DataTable
        label="Stopa po proizvodu"
        rows={products}
        rowKey={({ p }) => p.id}
        initialSort={{ key: 'n', dir: 'asc' }}
        columns={[
          { key: 'n', header: 'Proizvod', render: ({ p }) => (<><div className={ui.cellTitle}>{p.name}</div><div className={ui.cellSub}>{p.sku}</div></>), sort: ({ p }) => p.name },
          { key: 'r', header: 'Stopa', num: true, render: ({ c }) => (c.pct === null ? '—' : pct(c.pct)), sort: ({ c }) => c.pct ?? -1 },
          { key: 's', header: 'Izvor', render: ({ c }) => <Pill tone={c.source === 'product' ? 'info' : 'neutral'} dot={false}>{commissionSourceLabel[c.source]}</Pill>, sort: ({ c }) => c.source },
          { key: 'a', header: 'Po komadu', num: true, render: ({ p, c }) => (c.pct === null ? '—' : money2((p.sale_price * c.pct) / 100)) },
          {
            key: 'b',
            header: '',
            render: ({ p, c }) => (
              <Btn size="sm" onClick={() => setModal({ title: `Provizija: ${p.name}`, targets: [{ product_id: p.id }] })}>
                {c.source === 'product' ? 'Izmeni' : 'Posebna stopa'}
              </Btn>
            ),
          },
        ]}
      />
      {modal && <CommissionModal title={modal.title} targets={modal.targets} onClose={() => setModal(null)} onDone={async () => (setModal(null), await reloadCatalog())} />}
    </>
  );
}
