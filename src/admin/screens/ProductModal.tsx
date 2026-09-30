import { useEffect, useMemo, useRef, useState } from 'react';
import { routes } from '../../lib/url';
import { useAdmin } from '../AdminContext';
import { AdminIcon } from '../components/AdminIcon';
import { CommissionModal, PriceCorrectionModal, imgSrc, useCommission } from '../components/ProductBits';
import { Btn, Check, Field, Input, Modal, Notice, Pill, Select, TextArea, cx, ui, useAction, useLoad } from '../components/ui';
import { categoryPath, commissionSourceLabel, dateTime, money2, pct, priceModeLabel, rsd, stockLabel, stockTone } from '../lib/labels';
import { normalizeCode } from '../lib/stockImport';
import type { Product, ProductPatch, Spec } from '../lib/types';
import s from './ProductModal.module.css';

type Tab = 'details' | 'images' | 'stock' | 'price' | 'seo' | 'internal';
const tabs: { id: Tab; label: string }[] = [
  { id: 'details', label: 'Opis' },
  { id: 'images', label: 'Slike i dokumenti' },
  { id: 'stock', label: 'Zalihe' },
  { id: 'price', label: 'Cena i provizija' },
  { id: 'seo', label: 'SEO' },
  { id: 'internal', label: 'Interno' },
];

const editable: (keyof ProductPatch)[] = [
  'name', 'sku', 'slug', 'category_id', 'kicker', 'summary', 'description_html', 'specs', 'maintenance', 'badge_label', 'badge_tone',
  'is_visible', 'is_featured', 'content_status', 'seo_title', 'seo_description', 'primary_keyword', 'weight_kg', 'dimensions_cm', 'made_to_order',
];

export function ProductModal({ id, onClose }: { id: number; onClose: () => void }) {
  const { api, catalog, reloadCatalog, markChanged } = useAdmin();
  const product = catalog?.products.find((p) => p.id === id);
  const [tab, setTab] = useState<Tab>('details');
  const [draft, setDraft] = useState<ProductPatch>({});
  const [internal, setInternal] = useState({ data_notes: '', codes: '' });
  const [sub, setSub] = useState<'price' | 'commission' | null>(null);
  const { busy, run } = useAction();

  useEffect(() => {
    if (!product) return;
    setDraft(Object.fromEntries(editable.map((k) => [k, structuredClone(product[k as keyof Product])])) as ProductPatch);
    setInternal({ data_notes: product.internal.data_notes ?? '', codes: product.internal.stock_codes.join(', ') });
  }, [product?.id, product?.updated_at]);

  const dirty = useMemo(() => {
    if (!product) return false;
    const changed = editable.some((k) => JSON.stringify(draft[k] ?? null) !== JSON.stringify(product[k as keyof Product] ?? null));
    return changed || internal.data_notes !== (product.internal.data_notes ?? '') || internal.codes !== product.internal.stock_codes.join(', ');
  }, [draft, internal, product]);

  if (!catalog) return null;
  if (!product)
    return (
      <Modal title="Proizvod nije pronađen" onClose={onClose}>
        <Notice tone="warning">Proizvod možda više ne postoji.</Notice>
      </Modal>
    );

  const set = <K extends keyof ProductPatch>(k: K, v: ProductPatch[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const save = () =>
    run(async () => {
      const patch: ProductPatch = {};
      for (const k of editable) if (JSON.stringify(draft[k] ?? null) !== JSON.stringify(product[k as keyof Product] ?? null)) (patch as Record<string, unknown>)[k] = draft[k];
      if (Object.keys(patch).length) await api.updateProduct(product.id, patch);
      const codes = internal.codes.split(/[,;\n]/).map(normalizeCode).filter(Boolean);
      if (internal.data_notes !== (product.internal.data_notes ?? '') || codes.join(',') !== product.internal.stock_codes.join(','))
        await api.updateProductInternal(product.id, { data_notes: internal.data_notes || null, stock_codes: codes });
      markChanged();
      await reloadCatalog();
    }, 'Proizvod sačuvan');

  return (
    <Modal
      wide
      dirty={dirty}
      title={product.name}
      subtitle={
        <span className={s.sub}>
          {product.sku} · {categoryPath(catalog.categories, product.category_id)} · {product.is_visible ? <a href={routes.product(product.slug)} target="_blank" rel="noreferrer">Otvori u prodavnici ↗</a> : 'sakriven'}
        </span>
      }
      onClose={onClose}
      footer={
        <>
          {dirty && <span className={cx(ui.small, ui.warnText)} style={{ marginRight: 'auto', alignSelf: 'center' }}>Nesačuvane izmene</span>}
          <Btn onClick={onClose}>Zatvori</Btn>
          <Btn variant="primary" icon="check" busy={busy} disabled={!dirty} onClick={save}>
            Sačuvaj
          </Btn>
        </>
      }
    >
      <div className={s.tabs} role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={cx(s.tab, tab === t.id && s.tabActive)} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <div className={ui.stack}>
          <div className={ui.grid2}>
            <Field label="Naziv" className={ui.span2}>
              {(fid) => <Input id={fid} value={draft.name ?? ''} onChange={(e) => set('name', e.target.value)} />}
            </Field>
            <Field label="Šifra (SKU)" hint="Mora biti jedinstvena.">
              {(fid) => <Input id={fid} value={draft.sku ?? ''} onChange={(e) => set('sku', e.target.value)} />}
            </Field>
            <Field label="Kategorija">
              {(fid) => (
                <Select id={fid} value={draft.category_id ?? ''} onChange={(e) => set('category_id', e.target.value ? Number(e.target.value) : null)}>
                  <option value="">Bez kategorije</option>
                  {catalog.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {categoryPath(catalog.categories, c.id)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Kratka linija na kartici" hint="Npr. „Ispod sudopere · 6 stepeni”.">
              {(fid) => <Input id={fid} value={draft.kicker ?? ''} onChange={(e) => set('kicker', e.target.value || null)} />}
            </Field>
            <Field label="Održavanje / godišnji trošak" hint="Npr. „Održavanje: oko 4.500 RSD godišnje”.">
              {(fid) => <Input id={fid} value={draft.maintenance ?? ''} onChange={(e) => set('maintenance', e.target.value || null)} />}
            </Field>
            <Field label="Sažetak" hint="1–2 rečenice, samo funkcija, bez zdravstvenih tvrdnji." className={ui.span2}>
              {(fid) => <TextArea id={fid} rows={3} value={draft.summary ?? ''} onChange={(e) => set('summary', e.target.value || null)} />}
            </Field>
            <Field label="Opis (HTML)" hint="Dugi tekstovi DA se ne kopiraju. Dozvoljeni su <p>, <ul>, <li>, <strong>." className={ui.span2}>
              {(fid) => <TextArea id={fid} rows={6} className={ui.mono} value={draft.description_html ?? ''} onChange={(e) => set('description_html', e.target.value || null)} />}
            </Field>
          </div>
          <SpecsEditor specs={draft.specs ?? []} onChange={(v) => set('specs', v)} />
          <div className={ui.grid3}>
            <Field label="Oznaka (badge)" hint="Npr. „Najbolje za piće”.">
              {(fid) => <Input id={fid} value={draft.badge_label ?? ''} onChange={(e) => set('badge_label', e.target.value || null)} />}
            </Field>
            <Field label="Boja oznake">
              {(fid) => (
                <Select id={fid} value={draft.badge_tone ?? ''} onChange={(e) => set('badge_tone', e.target.value || null)}>
                  <option value="">—</option>
                  <option value="info">Plava (preporuka)</option>
                  <option value="natura">Zelena (najbolja vrednost)</option>
                  <option value="sand">Peščana (za koga)</option>
                  <option value="success">Uspeh</option>
                  <option value="warning">Upozorenje</option>
                  <option value="neutral">Neutralna</option>
                </Select>
              )}
            </Field>
            <Field label="Status teksta">
              {(fid) => (
                <Select id={fid} value={draft.content_status ?? 'partner_copy'} onChange={(e) => set('content_status', e.target.value as Product['content_status'])}>
                  <option value="partner_copy">Tekst partnera</option>
                  <option value="rewritten">Prepravljen</option>
                  <option value="approved">Odobren</option>
                </Select>
              )}
            </Field>
          </div>
          <div className={ui.row}>
            <Check label="Vidljiv u prodavnici" checked={!!draft.is_visible} onChange={(v) => set('is_visible', v)} />
            <Check label="Istaknut na početnoj" checked={!!draft.is_featured} onChange={(v) => set('is_featured', v)} />
          </div>
          <div className={ui.grid3}>
            <Field label="Težina" hint="Čuva se za kasnije; ne koristi se za cenu dostave.">
              {(fid) => (
                <div className={ui.inputSuffix}>
                  <Input id={fid} inputMode="decimal" value={draft.weight_kg ?? ''} onChange={(e) => set('weight_kg', e.target.value ? Number(e.target.value.replace(',', '.')) : null)} />
                  <span>kg</span>
                </div>
              )}
            </Field>
            <Field label="Kutija D × Š × V" hint="U centimetrima.">
              {(fid) => (
                <Input
                  id={fid}
                  placeholder="40 × 30 × 20"
                  value={draft.dimensions_cm ? [draft.dimensions_cm.length, draft.dimensions_cm.width, draft.dimensions_cm.height].filter((x) => x !== undefined).join(' × ') : ''}
                  onChange={(e) => {
                    const n = e.target.value.split(/[x×*,\s]+/).map(Number).filter((x) => Number.isFinite(x) && x > 0);
                    set('dimensions_cm', n.length ? { length: n[0], width: n[1], height: n[2] } : null);
                  }}
                />
              )}
            </Field>
          </div>
        </div>
      )}

      {tab === 'images' && <ImagesTab product={product} />}

      {tab === 'stock' && (
        <div className={ui.stack}>
          <div className={ui.row}>
            <Pill tone={stockTone[product.stock_state]}>{stockLabel[product.stock_state]}</Pill>
            <span>{product.stock_qty === null ? 'Količina nepoznata' : `${product.stock_qty} kom`}</span>
            <span className={ui.muted}>· poslednji uvoz: {dateTime(product.stock_updated_at)}</span>
          </div>
          <Notice tone="info">Količina dolazi samo iz uvoza zaliha (fajl DA). Ovde se ne menja ručno.</Notice>
          <Check
            label="Po porudžbini kada nema na stanju (3–4 meseca)"
            checked={!!draft.made_to_order}
            onChange={(v) => set('made_to_order', v)}
          />
          <Field
            label="Šifre u fajlu DA"
            hint={`Odvojite zarezom. Prazno = koristi SKU (${normalizeCode(product.sku)}). Oznake dobavljača na kraju (KL, DW, USTM, KOM) se ne pišu; redovi sa njima se sabiraju.`}
          >
            {(fid) => <Input id={fid} className={ui.mono} value={internal.codes} onChange={(e) => setInternal((x) => ({ ...x, codes: e.target.value }))} placeholder={normalizeCode(product.sku)} />}
          </Field>
        </div>
      )}

      {tab === 'price' && (
        <PriceTab product={product} onCorrect={() => setSub('price')} onCommission={() => setSub('commission')} />
      )}

      {tab === 'seo' && (
        <div className={ui.stack}>
          <Field label={`SEO naslov (${(draft.seo_title ?? '').length}/60)`} hint="Prazno = naziv proizvoda. Do 60 znakova.">
            {(fid) => <Input id={fid} value={draft.seo_title ?? ''} onChange={(e) => set('seo_title', e.target.value || null)} placeholder={product.name} />}
          </Field>
          <Field label={`SEO opis (${(draft.seo_description ?? '').length}/155)`} hint="140–155 znakova.">
            {(fid) => <TextArea id={fid} rows={3} value={draft.seo_description ?? ''} onChange={(e) => set('seo_description', e.target.value || null)} />}
          </Field>
          <Field label="Glavna ključna reč" hint="Npr. „reverzna osmoza”, „BL 10 uložak”.">
            {(fid) => <Input id={fid} value={draft.primary_keyword ?? ''} onChange={(e) => set('primary_keyword', e.target.value || null)} />}
          </Field>
          <Field label="Adresa (slug)" hint="Menjajte samo pre lansiranja: promena menja link proizvoda.">
            {(fid) => <Input id={fid} className={ui.mono} value={draft.slug ?? ''} onChange={(e) => set('slug', e.target.value)} />}
          </Field>
        </div>
      )}

      {tab === 'internal' && (
        <div className={ui.stack}>
          <Notice tone="info" icon="lock">Vidite samo vi. Ne prikazuje se u prodavnici.</Notice>
          <Field label="Napomena o podacima" hint="Npr. pogrešna šifra kod DA, duplikat, nedostaje slika.">
            {(fid) => <TextArea id={fid} rows={3} value={internal.data_notes} onChange={(e) => setInternal((x) => ({ ...x, data_notes: e.target.value }))} />}
          </Field>
          <dl className={ui.dl}>
            <dt>Naziv kod DA</dt>
            <dd>{product.internal.partner_name ?? '—'}</dd>
            <dt>Stranica kod DA</dt>
            <dd>{product.partner_url ? <a href={product.partner_url} target="_blank" rel="noreferrer">{product.partner_url}</a> : '—'}</dd>
          </dl>
          {product.internal.partner_description_html && (
            <details>
              <summary className={ui.label} style={{ cursor: 'pointer' }}>
                Tekst partnera (samo za referencu)
              </summary>
              <div className={s.partnerText} dangerouslySetInnerHTML={{ __html: stripScripts(product.internal.partner_description_html) }} />
            </details>
          )}
        </div>
      )}

      {sub === 'price' && <PriceCorrectionModal products={[product]} onClose={() => setSub(null)} onDone={async () => (setSub(null), await reloadCatalog())} />}
      {sub === 'commission' && (
        <CommissionModal title="Provizija za ovaj proizvod" targets={[{ product_id: product.id }]} onClose={() => setSub(null)} onDone={async () => (setSub(null), await reloadCatalog())} />
      )}
    </Modal>
  );
}

function stripScripts(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/ on\w+="[^"]*"/gi, '');
}

function SpecsEditor({ specs, onChange }: { specs: Spec[]; onChange: (v: Spec[]) => void }) {
  const upd = (i: number, k: keyof Spec, v: string) => onChange(specs.map((s2, j) => (j === i ? { ...s2, [k]: v } : s2)));
  return (
    <div className={ui.field}>
      <span className={ui.label}>Specifikacije</span>
      <div className={s.specs}>
        {specs.map((sp, i) => (
          <div key={i} className={s.specRow}>
            <Input aria-label="Naziv" value={sp.label} onChange={(e) => upd(i, 'label', e.target.value)} placeholder="Npr. Protok" />
            <Input aria-label="Vrednost" value={sp.value} onChange={(e) => upd(i, 'value', e.target.value)} placeholder="Npr. 190 l/dan" />
            <Btn size="sm" variant="ghost" icon="arrowUp" iconOnly aria-label="Gore" disabled={i === 0} onClick={() => onChange(move(specs, i, -1))} />
            <Btn size="sm" variant="ghost" icon="trash" iconOnly aria-label="Obriši" onClick={() => onChange(specs.filter((_, j) => j !== i))} />
          </div>
        ))}
      </div>
      <div>
        <Btn size="sm" icon="plus" onClick={() => onChange([...specs, { label: '', value: '' }])}>
          Dodaj red
        </Btn>
      </div>
    </div>
  );
}
function move<T>(arr: T[], i: number, d: number): T[] {
  const a = [...arr];
  const [x] = a.splice(i, 1);
  a.splice(i + d, 0, x);
  return a;
}

function PriceTab({ product, onCorrect, onCommission }: { product: Product; onCorrect: () => void; onCommission: () => void }) {
  const { api } = useAdmin();
  const commission = useCommission()(product);
  const { data: history } = useLoad(() => api.priceHistory(product.id), [api, product.id, product.sale_price]);
  const sourceLabel = { sync: 'Čitanje sa DA', override: 'Korekcija', bulk: 'Grupna izmena', import: 'Uvoz kataloga', manual: 'Ručno' } as const;
  return (
    <div className={ui.stack}>
      <div className={s.priceGrid}>
        <div className={s.priceBox}>
          <span>Cena DA (sa PDV-om)</span>
          <b>{rsd(product.partner_price)}</b>
          <small>Čita se sa decorambient.com</small>
        </div>
        <div className={s.priceBox}>
          <span>Način</span>
          <b>{priceModeLabel[product.price_mode]}{product.price_mode === 'percent' ? ` ${product.price_override} %` : ''}</b>
          <small>{product.price_mode === 'auto' ? 'Prati cenu DA' : 'Ručna korekcija greške'}</small>
        </div>
        <div className={s.priceBox}>
          <span>Prodajna cena</span>
          <b className={ui.brand}>{rsd(product.sale_price)}</b>
          <small>Ovo vidi kupac</small>
        </div>
        <div className={s.priceBox}>
          <span>Provizija</span>
          <b>{commission.pct === null ? '—' : pct(commission.pct)}</b>
          <small>{commission.pct === null ? 'nije uneta' : `${money2((product.sale_price * commission.pct) / 100)} · ${commissionSourceLabel[commission.source]}`}</small>
        </div>
      </div>
      <div className={ui.row}>
        <Btn icon="tag" onClick={onCorrect}>
          {product.price_mode === 'auto' ? 'Ispravi cenu' : 'Izmeni korekciju'}
        </Btn>
        <Btn icon="percent" onClick={onCommission}>
          Provizija za proizvod
        </Btn>
      </div>
      <div>
        <h3 className={ui.label} style={{ margin: '8px 0' }}>
          Istorija cene
        </h3>
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>Datum</th>
                <th className={ui.num}>Stara</th>
                <th className={ui.num}>Nova</th>
                <th>Izvor</th>
              </tr>
            </thead>
            <tbody>
              {(history ?? []).map((h) => (
                <tr key={h.id}>
                  <td>{dateTime(h.changed_at)}</td>
                  <td className={ui.num}>{rsd(h.old_price)}</td>
                  <td className={ui.num}>{rsd(h.new_price)}</td>
                  <td>{sourceLabel[h.source]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ImagesTab({ product }: { product: Product }) {
  const { api, reloadCatalog, markChanged } = useAdmin();
  const { busy, run } = useAction();
  const fileRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const { data: docs, reload: reloadDocs } = useLoad(() => api.listDocuments(product.id), [api, product.id]);
  const [alts, setAlts] = useState<Record<number, string>>({});
  const images = product.images;
  const done = async () => {
    markChanged();
    await reloadCatalog();
  };

  const upload = (files: FileList | null) =>
    files &&
    run(async () => {
      for (const f of Array.from(files)) {
        if (!f.type.startsWith('image/')) throw new Error(`${f.name} nije slika`);
        const src = await api.uploadFile('products', f);
        await api.addImage(product.id, src, product.name);
      }
      await done();
    }, 'Slike dodate');

  return (
    <div className={ui.stack}>
      {images.length < 3 && <Notice tone="warning">Proizvod ima {images.length} slik{images.length === 1 ? 'u' : 'e'}. Plan je 3–5 slika po glavnom proizvodu.</Notice>}
      <div className={s.images}>
        {images.map((img, i) => (
          <figure key={img.id} className={cx(s.image, img.is_primary && s.imagePrimary)}>
            <img src={imgSrc(img.src)} alt={img.alt} loading="lazy" />
            {img.is_primary && <span className={s.primaryTag}>Glavna</span>}
            <Input
              aria-label="Alt tekst"
              placeholder="Alt tekst"
              value={alts[img.id] ?? img.alt}
              onChange={(e) => setAlts((a) => ({ ...a, [img.id]: e.target.value }))}
              onBlur={() => alts[img.id] !== undefined && alts[img.id] !== img.alt && run(async () => (await api.updateImage(img.id, { alt: alts[img.id] }), await done()), 'Alt tekst sačuvan')}
            />
            <div className={s.imageActions}>
              <Btn size="sm" variant="ghost" icon="chevronLeft" iconOnly aria-label="Pomeri levo" disabled={i === 0 || busy} onClick={() => run(async () => (await api.reorderImages(product.id, move(images, i, -1).map((x) => x.id)), await done()))} />
              <Btn size="sm" variant="ghost" icon="chevronRight" iconOnly aria-label="Pomeri desno" disabled={i === images.length - 1 || busy} onClick={() => run(async () => (await api.reorderImages(product.id, move(images, i, 1).map((x) => x.id)), await done()))} />
              <Btn size="sm" variant="ghost" icon="star" iconOnly aria-label="Postavi kao glavnu" disabled={img.is_primary || busy} onClick={() => run(async () => (await api.setPrimaryImage(product.id, img.id), await done()), 'Glavna slika promenjena')} />
              <Btn size="sm" variant="ghost" icon="trash" iconOnly aria-label="Obriši sliku" disabled={busy} onClick={() => window.confirm('Obrisati ovu sliku?') && run(async () => (await api.deleteImage(img.id), await done()), 'Slika obrisana')} />
            </div>
          </figure>
        ))}
        <button className={s.addImage} onClick={() => fileRef.current?.click()} disabled={busy}>
          <AdminIcon name="upload" size={22} />
          Dodaj slike
          <small>JPG, PNG, WebP do 10 MB</small>
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(e) => (upload(e.target.files), (e.target.value = ''))} />
      </div>

      <div>
        <h3 className={ui.label} style={{ margin: '8px 0' }}>
          Dokumenti (PDF uputstva i sertifikati)
        </h3>
        <ul className={s.docs}>
          {(docs ?? []).map((d) => (
            <li key={d.id}>
              <AdminIcon name="file" size={16} />
              <a href={d.url} target="_blank" rel="noreferrer">
                {d.title}
              </a>
              <Btn size="sm" variant="ghost" icon="trash" iconOnly aria-label="Obriši dokument" onClick={() => run(async () => (await api.deleteDocument(d.id), reloadDocs(), markChanged()), 'Dokument obrisan')} />
            </li>
          ))}
          {docs && !docs.length && <li className={ui.muted}>Nema dokumenata.</li>}
        </ul>
        <Btn size="sm" icon="upload" busy={busy} onClick={() => docRef.current?.click()}>
          Dodaj PDF
        </Btn>
        <input
          ref={docRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            const title = window.prompt('Naziv dokumenta (npr. „Uputstvo za ugradnju”)', f.name.replace(/\.pdf$/i, ''));
            if (!title) return;
            run(async () => (await api.addDocument(product.id, title, await api.uploadFile('documents', f)), reloadDocs(), markChanged()), 'Dokument dodat');
          }}
        />
      </div>
    </div>
  );
}
