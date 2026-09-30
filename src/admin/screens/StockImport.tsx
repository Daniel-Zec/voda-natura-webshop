import { useRef, useState } from 'react';
import { useAdmin } from '../AdminContext';
import { AdminIcon } from '../components/AdminIcon';
import { ProductTabs } from '../components/ProductBits';
import { Btn, Card, DataTable, Empty, Loading, Modal, Notice, PageHeader, Pill, ui, useAction, useLoad } from '../components/ui';
import { dateTime, stockLabel, stockTone } from '../lib/labels';
import { buildPreview, readStockFile, type StockPreview } from '../lib/stockImport';
import type { StockImportRow } from '../lib/types';
import s from './screens.module.css';

const statusLabel = { success: 'Uspešno', warnings: 'Sa upozorenjima', failed: 'Neuspešno', undone: 'Poništeno' } as const;
const statusTone = { success: 'success', warnings: 'warning', failed: 'error', undone: 'neutral' } as const;

export function StockImport() {
  const { api, catalog, reloadCatalog, markChanged } = useAdmin();
  const { data: history, reload } = useLoad(() => api.listStockImports(), [api]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<StockPreview | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [showFailed, setShowFailed] = useState<StockImportRow | null>(null);
  const [list, setList] = useState<'changes' | 'failed' | 'notInFile' | 'notInShop'>('changes');
  const inputRef = useRef<HTMLInputElement>(null);
  const { busy, run } = useAction();

  if (!catalog) return <Loading />;

  const load = async (f: File) => {
    setFile(f);
    setPreview(null);
    setReadError(null);
    try {
      const parsed = await readStockFile(f);
      if (parsed.error) return setReadError(parsed.error);
      const pv = buildPreview(parsed, catalog.products);
      setPreview(pv);
      setList(pv.changes.length ? 'changes' : pv.failed.length ? 'failed' : 'changes');
    } catch (e) {
      setReadError(`Fajl nije mogao da se pročita: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const apply = () =>
    preview &&
    file &&
    run(async () => {
      await api.applyStockImport({
        fileName: file.name,
        changes: preview.changes.map((c) => ({ product_id: c.productId, qty: c.newQty })),
        summary: {
          changed: preview.changes.length,
          toOut: preview.toOut.length,
          backIn: preview.backIn.length,
          notInFile: preview.notInFile.map((p) => p.sku),
          failed: preview.failed.map((f) => ({ code: f.code, reason: f.reason })),
        },
        status: preview.status,
        rowsRead: preview.rowsRead,
        rowsMatched: preview.rowsMatched,
        rowsFailed: preview.failed.length,
      });
      markChanged();
      setFile(null);
      setPreview(null);
      reload();
      await reloadCatalog();
    }, 'Zalihe su ažurirane');

  const latestActive = history?.find((h) => h.status !== 'undone');

  return (
    <>
      <PageHeader title="Proizvodi" subtitle="DA šalje fajl sa zalihama na zalihe@vodanatura.com 1–2 puta nedeljno. Uvoz menja samo zalihe." />
      <ProductTabs active="stock" />

      {!preview && (
        <div
          className={`${s.dropzone} ${drag ? s.dropActive : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
          onDragOver={(e) => (e.preventDefault(), setDrag(true))}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files[0];
            if (f) load(f);
          }}
        >
          <AdminIcon name="upload" size={32} />
          <strong>{file ? file.name : 'Prevucite fajl ovde ili kliknite da izaberete'}</strong>
          <span>.ods, .xlsx, .xls ili .csv iz knjigovodstva DA („roba spisak”)</span>
          <input ref={inputRef} type="file" hidden accept=".ods,.xlsx,.xls,.csv" onChange={(e) => (e.target.files?.[0] && load(e.target.files[0]), (e.target.value = ''))} />
        </div>
      )}
      {readError && (
        <div style={{ marginTop: 16 }}>
          <Notice tone="error">{readError}</Notice>
        </div>
      )}

      {preview && file && (
        <Card
          title={
            <>
              Pregled: {file.name} <Pill tone={statusTone[preview.status]}>{statusLabel[preview.status]}</Pill>
            </>
          }
        >
          <div className={ui.stack}>
            {preview.noQuantities && (
              <Notice tone="error">
                <strong>Fajl nema količine.</strong> Kolone „Količina” i „Slobodna količina” su prazne, pa zalihe ne mogu da se ažuriraju. Zamolite DA da pošalje izvoz sa popunjenim stanjem.
              </Notice>
            )}
            <div className={s.statGrid}>
              <div className={s.stat}><b>{preview.rowsRead}</b><span>redova pročitano</span></div>
              <div className={s.stat}><b>{preview.rowsMatched}</b><span>redova povezano sa proizvodima</span></div>
              <div className={s.stat}><b>{preview.changes.length}</b><span>promena zaliha</span></div>
              <div className={s.stat}><b className={ui.errorText}>{preview.toOut.length}</b><span>ostaje bez zaliha</span></div>
              <div className={s.stat}><b className={ui.brand}>{preview.backIn.length}</b><span>ponovo na stanju</span></div>
              <div className={s.stat}><b className={preview.failed.length ? ui.warnText : undefined}>{preview.failed.length}</b><span>neuspelih redova</span></div>
            </div>
            <p className={ui.small} style={{ margin: 0, color: 'var(--vn-color-text-secondary)' }}>
              Količina = „Slobodna količina” (rezervisano je već oduzeto). Redovi istog proizvoda sa oznakom dobavljača (KL, DW, USTM, KOM) se sabiraju. {preview.unchanged} proizvoda je bez promene.
            </p>
            <div className={ui.row}>
              {(['changes', 'failed', 'notInFile', 'notInShop'] as const).map((k) => (
                <Btn key={k} size="sm" variant={list === k ? 'secondary' : 'outline'} onClick={() => setList(k)}>
                  {{ changes: 'Promene', failed: 'Neuspeli redovi', notInFile: 'Proizvodi kojih nema u fajlu', notInShop: 'Artikli kojih nema u prodavnici' }[k]} (
                  {{ changes: preview.changes.length, failed: preview.failed.length, notInFile: preview.notInFile.length, notInShop: preview.notInShop.length }[k]})
                </Btn>
              ))}
            </div>
            {list === 'changes' && (
              <DataTable
                label="Promene zaliha"
                rows={preview.changes}
                rowKey={(c) => c.productId}
                pageSize={30}
                columns={[
                  { key: 'p', header: 'Proizvod', render: (c) => (<><div className={ui.cellTitle}>{c.name}</div><div className={ui.cellSub}>{c.sku} ← {c.codes.join(' + ')}</div></>), sort: (c) => c.name },
                  { key: 'old', header: 'Sada', num: true, render: (c) => (c.oldQty === null ? '—' : c.oldQty), sort: (c) => c.oldQty ?? -1 },
                  { key: 'new', header: 'Novo', num: true, render: (c) => <strong>{c.newQty}</strong>, sort: (c) => c.newQty },
                  { key: 'st', header: 'Stanje', render: (c) => (c.oldState === c.newState ? <Pill tone={stockTone[c.newState]}>{stockLabel[c.newState]}</Pill> : <span className={ui.row} style={{ gap: 4 }}><Pill tone={stockTone[c.oldState]}>{stockLabel[c.oldState]}</Pill>→<Pill tone={stockTone[c.newState]}>{stockLabel[c.newState]}</Pill></span>) },
                ]}
                empty={<Empty icon="check" title="Nema promena" />}
              />
            )}
            {list === 'failed' && (
              <DataTable
                label="Neuspeli redovi"
                rows={preview.failed}
                rowKey={(f) => `${f.line}-${f.code}`}
                pageSize={30}
                columns={[
                  { key: 'l', header: 'Red', num: true, render: (f) => f.line },
                  { key: 'c', header: 'Šifra u fajlu', render: (f) => <span className={ui.mono}>{f.code}</span> },
                  { key: 'n', header: 'Artikal → proizvod', render: (f) => f.name },
                  { key: 'r', header: 'Razlog', render: (f) => <span className={ui.errorText}>{f.reason}</span> },
                ]}
                empty={<Empty icon="check" title="Nema neuspelih redova" />}
              />
            )}
            {list === 'notInFile' && (
              <DataTable
                label="Proizvodi kojih nema u fajlu"
                rows={preview.notInFile}
                rowKey={(p) => p.id}
                columns={[
                  { key: 'p', header: 'Proizvod', render: (p) => (<><div className={ui.cellTitle}>{p.name}</div><div className={ui.cellSub}>{p.sku}</div></>) },
                ]}
                empty={<Empty icon="check" title="Svi vidljivi proizvodi su u fajlu" />}
                footer={<span>Zalihe ovih proizvoda se ne menjaju. Ako je šifra drugačija, upišite je u proizvodu (kartica Zalihe).</span>}
              />
            )}
            {list === 'notInShop' && (
              <DataTable
                label="Artikli kojih nema u prodavnici"
                rows={preview.notInShop}
                rowKey={(r) => `${r.line}`}
                pageSize={30}
                columns={[
                  { key: 'c', header: 'Šifra', render: (r) => <span className={ui.mono}>{r.code}</span> },
                  { key: 'n', header: 'Naziv', render: (r) => r.name },
                  { key: 'q', header: 'Količina', num: true, render: (r) => (r.qty === null ? '—' : r.qty) },
                ]}
                footer={<span>Samo informacija: npr. vodovodni materijal ili proizvodi koje još ne prodajemo.</span>}
              />
            )}
            <div className={ui.row} style={{ justifyContent: 'flex-end' }}>
              <Btn onClick={() => (setPreview(null), setFile(null))}>Odustani</Btn>
              <Btn variant="primary" icon="check" busy={busy} disabled={preview.status === 'failed' || !preview.changes.length} onClick={apply}>
                Primeni {preview.changes.length} promena
              </Btn>
            </div>
          </div>
        </Card>
      )}

      <h2 style={{ fontSize: 16, margin: '32px 0 12px' }}>Istorija uvoza</h2>
      {!history ? (
        <Loading />
      ) : (
        <DataTable
          label="Istorija uvoza"
          rows={history}
          rowKey={(h) => h.id}
          columns={[
            { key: 'd', header: 'Datum', render: (h) => <span className={ui.nowrap}>{dateTime(h.created_at)}</span> },
            { key: 'f', header: 'Fajl', render: (h) => h.file_name },
            { key: 's', header: 'Status', render: (h) => <Pill tone={statusTone[h.status]}>{statusLabel[h.status]}</Pill> },
            { key: 'r', header: 'Redova', num: true, render: (h) => h.rows_read },
            { key: 'm', header: 'Povezano', num: true, render: (h) => h.rows_matched },
            { key: 'c', header: 'Promena', num: true, render: (h) => h.summary?.changed ?? '—' },
            { key: 'o', header: 'Bez zaliha / nazad', num: true, render: (h) => `${h.summary?.toOut ?? 0} / ${h.summary?.backIn ?? 0}` },
            {
              key: 'x',
              header: 'Neuspelo',
              num: true,
              render: (h) => (h.rows_failed ? <button className={ui.tab} style={{ padding: 0, color: 'var(--vn-color-text-link)' }} onClick={() => setShowFailed(h)}>{h.rows_failed}</button> : 0),
            },
            {
              key: 'u',
              header: '',
              render: (h) =>
                h.id === latestActive?.id ? (
                  <Btn size="sm" icon="undo" busy={busy} onClick={() => window.confirm('Vratiti zalihe na stanje pre ovog uvoza?') && run(async () => (await api.undoStockImport(h.id), markChanged(), reload(), await reloadCatalog()), 'Uvoz je poništen')}>
                    Poništi
                  </Btn>
                ) : null,
            },
          ]}
          empty={<Empty icon="upload" title="Još nema uvoza" />}
        />
      )}
      <p className={ui.small} style={{ color: 'var(--vn-color-text-muted)' }}>
        Poništiti se može samo poslednji uvoz. Faza 2: sanduče zalihe@ samo priprema uvoz kada stigne email od DA.
      </p>

      {showFailed && (
        <Modal title={`Neuspeli redovi: ${showFailed.file_name}`} onClose={() => setShowFailed(null)}>
          <ul>
            {(showFailed.summary?.failed ?? []).map((f, i) => (
              <li key={i}>
                <span className={ui.mono}>{f.code}</span>: {f.reason}
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </>
  );
}
