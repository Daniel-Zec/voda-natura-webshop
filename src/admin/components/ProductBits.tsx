import { useMemo, useState } from 'react';
import { url } from '../../lib/url';
import { useAdmin } from '../AdminContext';
import { commissionFor, previewPrice, priceModeLabel, rsd, settingNumber, stockLabel, stockTone } from '../lib/labels';
import type { Product, PriceMode } from '../lib/types';
import { href } from '../router';
import { AdminIcon } from './AdminIcon';
import { Btn, Field, Input, Modal, Notice, Pill, Select, Tabs, ui, useAction } from './ui';

export const imgSrc = (src: string) => (/^(https?:|blob:|data:)/.test(src) ? src : url(src));

export function Thumb({ p }: { p: Product }) {
  const img = p.images.find((i) => i.is_primary) ?? p.images[0];
  return img ? <img className={ui.thumb} src={imgSrc(img.src)} alt="" loading="lazy" width={40} height={40} /> : <span className={`${ui.thumb} ${ui.thumbEmpty}`}><AdminIcon name="image" size={16} /></span>;
}

export function StockCell({ p }: { p: Product }) {
  return (
    <>
      <Pill tone={stockTone[p.stock_state]}>{stockLabel[p.stock_state]}</Pill>
      <div className={ui.cellSub}>{p.stock_qty === null ? 'količina nepoznata' : `${p.stock_qty} kom`}</div>
    </>
  );
}

export function ProductTabs({ active }: { active: 'list' | 'gallery' | 'stock' | 'prices' }) {
  const { catalog } = useAdmin();
  return (
    <Tabs
      active={active}
      items={[
        { id: 'list', label: 'Proizvodi', href: href('proizvodi'), count: catalog?.products.length },
        { id: 'gallery', label: 'Galerija slika', href: href('proizvodi', 'galerija') },
        { id: 'stock', label: 'Uvoz zaliha', href: href('proizvodi', 'zalihe') },
        { id: 'prices', label: 'Cene', href: href('proizvodi', 'cene') },
      ]}
    />
  );
}

/** Price correction for one or many products, with old → new preview before saving. */
export function PriceCorrectionModal({ products, onClose, onDone }: { products: Product[]; onClose: () => void; onDone: () => void }) {
  const { api, catalog, markChanged } = useAdmin();
  const single = products.length === 1 ? products[0] : null;
  const [mode, setMode] = useState<PriceMode>(single?.price_mode === 'auto' || !single ? 'percent' : single.price_mode);
  const [value, setValue] = useState<string>(single?.price_override !== null && single?.price_override !== undefined ? String(single.price_override) : '');
  const { busy, run } = useAction();
  const rounding = catalog ? settingNumber(catalog.settings, 'price_rounding_rsd', 10) : 10;
  const v = value.trim() === '' ? null : Number(value.replace(',', '.'));
  const valid = mode === 'auto' || (v !== null && Number.isFinite(v) && (mode === 'percent' ? v > -90 && v < 200 : v > 0));

  const preview = useMemo(
    () => products.map((p) => ({ p, next: valid ? previewPrice(p.partner_price, mode, v, rounding) : p.sale_price })),
    [products, mode, v, valid, rounding],
  );

  return (
    <Modal
      title={single ? 'Korekcija cene' : `Korekcija cene za ${products.length} proizvoda`}
      subtitle="Samo za ispravku greške (npr. pogrešna cena na decorambient.com). Nije za prodaju iznad ili ispod cene DA."
      onClose={onClose}
      dirty={value !== ''}
      footer={
        <>
          <Btn onClick={onClose}>Odustani</Btn>
          <Btn
            variant="primary"
            busy={busy}
            disabled={!valid}
            onClick={() =>
              run(async () => {
                await api.setPrices(products.map((p) => p.id), mode, mode === 'auto' ? null : v, single ? 'override' : 'bulk');
                markChanged();
                onDone();
              }, mode === 'auto' ? 'Cene vraćene na Auto' : 'Korekcija sačuvana')
            }
          >
            Sačuvaj
          </Btn>
        </>
      }
    >
      <div className={ui.stack}>
        <div className={ui.grid2}>
          <Field label="Način">
            {(id) => (
              <Select id={id} value={mode} onChange={(e) => setMode(e.target.value as PriceMode)}>
                <option value="percent">Procenat na cenu DA (prati promene)</option>
                <option value="fixed">Fiksna cena (ne prati promene)</option>
                <option value="auto">Auto – cena DA (ukloni korekciju)</option>
              </Select>
            )}
          </Field>
          {mode !== 'auto' && (
            <Field label={mode === 'percent' ? 'Procenat' : 'Cena sa PDV-om'} hint={mode === 'percent' ? `Npr. -5 ili 3. Zaokruženo na ${rounding} RSD.` : undefined}>
              {(id) => (
                <div className={ui.inputSuffix}>
                  <Input id={id} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
                  <span>{mode === 'percent' ? '%' : 'RSD'}</span>
                </div>
              )}
            </Field>
          )}
        </div>
        <div className={ui.tableWrap} style={{ maxHeight: 320, overflowY: 'auto' }}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>Proizvod</th>
                <th className={ui.num}>Cena DA</th>
                <th className={ui.num}>Sada</th>
                <th className={ui.num}>Nova</th>
              </tr>
            </thead>
            <tbody>
              {preview.map(({ p, next }) => (
                <tr key={p.id}>
                  <td>
                    <div className={ui.cellTitle}>{p.name}</div>
                    <div className={ui.cellSub}>
                      {p.sku} · {priceModeLabel[p.price_mode]}
                    </div>
                  </td>
                  <td className={ui.num}>{rsd(p.partner_price)}</td>
                  <td className={ui.num}>{rsd(p.sale_price)}</td>
                  <td className={ui.num}>
                    <strong className={next !== p.sale_price ? ui.brand : undefined}>{rsd(next)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {mode === 'fixed' && products.length > 1 && <Notice tone="warning">Svi izabrani proizvodi dobiće istu fiksnu cenu.</Notice>}
      </div>
    </Modal>
  );
}

/** Commission % for many products or categories at once. */
export function CommissionModal({ title, targets, onClose, onDone }: { title: string; targets: ({ category_id: number } | { product_id: number })[]; onClose: () => void; onDone: () => void }) {
  const { api } = useAdmin();
  const [value, setValue] = useState('');
  const { busy, run } = useAction();
  const v = value.trim() === '' ? null : Number(value.replace(',', '.'));
  const valid = v === null || (Number.isFinite(v) && v >= 0 && v <= 100);
  return (
    <Modal
      title={title}
      subtitle="Važi samo za nove porudžbine. Stare porudžbine čuvaju procenat iz trenutka kupovine."
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Odustani</Btn>
          <Btn variant="primary" busy={busy} disabled={!valid} onClick={() => run(async () => (await api.setCommissionRules(targets, v), onDone()), v === null ? 'Posebna stopa uklonjena' : 'Provizija sačuvana')}>
            {v === null ? 'Ukloni posebnu stopu' : 'Sačuvaj'}
          </Btn>
        </>
      }
    >
      <Field label="Provizija" hint="Prazno = ukloni posebnu stopu (važi stopa kategorije ili podrazumevana).">
        {(id) => (
          <div className={ui.inputSuffix}>
            <Input id={id} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
            <span>%</span>
          </div>
        )}
      </Field>
    </Modal>
  );
}

export function useCommission() {
  const { catalog } = useAdmin();
  return (p: Product) => (catalog ? commissionFor(catalog, p) : { pct: null, source: 'default' as const });
}
