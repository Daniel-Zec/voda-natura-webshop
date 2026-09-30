/**
 * Stock import from Decor Ambient's accounting export (.ods / .xlsx / .xls / .csv).
 *
 * The file (sample "roba spisak", 30 Sep 2026) has two header rows; the second one holds
 * the column names: Šifra artikla, Naziv artikla, …, Količina, Slobodna količina, …, Rezervisano.
 * One shop product can appear on several rows with a supplier suffix after the code
 * ("BL-10", "BL-10  KL", "BL 20BB  DW"): those rows are added up.
 *
 * Pure functions only, so they can be tested without a browser (see scripts/test-stock-import.mjs).
 */
import type { Product, StockState } from './types';

/** Supplier / unit suffixes seen at the end of DA codes. */
const SUFFIX = /\s+(KL|DW|USTM|KOM|AQV|U)\s*$/i;

/** "BL 20BB  DW" → "BL20BB"; "WF SLIM 20 3/4" → "WFSLIM2034". */
export function stockKey(code: string): string {
  let c = String(code ?? '').replace(/\s+/g, ' ').trim();
  let prev = '';
  while (prev !== c) {
    prev = c;
    c = c.replace(SUFFIX, '').trim();
  }
  return normalizeCode(c);
}

/** Upper case, letters and digits only. Also used for codes typed in the admin. */
export function normalizeCode(code: string): string {
  return String(code ?? '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9]/g, '');
}

function headerName(v: unknown): string {
  return normalizeCode(String(v ?? '')).toLowerCase();
}

export interface FileRow {
  line: number; // 1-based row number in the sheet
  code: string;
  key: string;
  name: string;
  qty: number | null;
  qtyProblem?: string;
}

export interface ParsedFile {
  rows: FileRow[];
  qtySource: 'free' | 'total-minus-reserved' | 'total' | 'none';
  error?: string;
}

/** Reads a quantity cell: 12, "12", "12,00", "1.234,00". Returns null when empty or unreadable. */
export function parseQty(v: unknown): { qty: number | null; problem?: string } {
  if (v === null || v === undefined || v === '') return { qty: null, problem: 'prazna količina' };
  if (typeof v === 'number') return Number.isFinite(v) ? { qty: Math.max(0, Math.floor(v)) } : { qty: null, problem: 'nečitljiva vrednost' };
  const s = String(v).trim().replace(/\s/g, '');
  if (!s) return { qty: null, problem: 'prazna količina' };
  const n = Number(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s);
  if (!Number.isFinite(n)) return { qty: null, problem: `nečitljiva vrednost „${String(v)}”` };
  return { qty: Math.max(0, Math.floor(n)) };
}

/** Turns sheet rows (array of arrays, as SheetJS `sheet_to_json(..., {header: 1})` returns) into file rows. */
export function parseSheet(sheet: unknown[][]): ParsedFile {
  const headerIdx = sheet.findIndex((r) => (r ?? []).some((c) => headerName(c) === 'sifraartikla'));
  if (headerIdx < 0) return { rows: [], qtySource: 'none', error: 'U fajlu nije pronađena kolona „Šifra artikla”.' };
  const header = sheet[headerIdx].map(headerName);
  const col = (name: string) => header.indexOf(name); // first occurrence (the STANJE block)
  const cCode = col('sifraartikla');
  const cName = col('nazivartikla');
  const cFree = col('slobodnakolicina');
  const cTotal = col('kolicina');
  const cReserved = col('rezervisano');

  const qtySource: ParsedFile['qtySource'] =
    cFree >= 0 ? 'free' : cTotal >= 0 && cReserved >= 0 ? 'total-minus-reserved' : cTotal >= 0 ? 'total' : 'none';
  if (qtySource === 'none') return { rows: [], qtySource, error: 'U fajlu nije pronađena kolona „Slobodna količina” ni „Količina”.' };

  const rows: FileRow[] = [];
  sheet.slice(headerIdx + 1).forEach((r, i) => {
    const code = String(r?.[cCode] ?? '').trim();
    const name = String(r?.[cName] ?? '').trim();
    if (!code || !name) return; // empty lines and the item-count line at the bottom
    let q: { qty: number | null; problem?: string };
    if (qtySource === 'free') {
      q = parseQty(r[cFree]);
      // Some exports leave "Slobodna" empty but fill "Količina"
      if (q.qty === null && cTotal >= 0 && r[cTotal] !== null && r[cTotal] !== undefined && r[cTotal] !== '') {
        const t = parseQty(r[cTotal]);
        const res = cReserved >= 0 ? parseQty(r[cReserved]).qty ?? 0 : 0;
        q = t.qty === null ? t : { qty: Math.max(0, t.qty - res) };
      }
    } else if (qtySource === 'total-minus-reserved') {
      const t = parseQty(r[cTotal]);
      const res = parseQty(r[cReserved]).qty ?? 0;
      q = t.qty === null ? t : { qty: Math.max(0, t.qty - res) };
    } else {
      q = parseQty(r[cTotal]);
    }
    rows.push({ line: headerIdx + i + 2, code, key: stockKey(code), name, qty: q.qty, qtyProblem: q.problem });
  });
  return { rows, qtySource };
}

export function stateFor(product: Pick<Product, 'made_to_order'>, qty: number): StockState {
  if (qty > 0) return 'in_stock';
  return product.made_to_order ? 'made_to_order' : 'out_of_stock';
}

export interface StockChange {
  productId: number;
  sku: string;
  name: string;
  oldQty: number | null;
  newQty: number;
  oldState: StockState;
  newState: StockState;
  codes: string[];
}

export interface StockPreview {
  rowsRead: number;
  rowsMatched: number;
  changes: StockChange[];
  unchanged: number;
  toOut: StockChange[];
  backIn: StockChange[];
  failed: { line: number; code: string; name: string; reason: string }[];
  notInFile: { id: number; sku: string; name: string }[];
  notInShop: FileRow[];
  noQuantities: boolean;
  status: 'success' | 'warnings' | 'failed';
}

/** Keys a product is matched by: its saved DA codes, or its own SKU. */
export function productKeys(p: Pick<Product, 'sku' | 'internal'>): string[] {
  const codes = (p.internal?.stock_codes ?? []).map(normalizeCode).filter(Boolean);
  return codes.length ? codes : [normalizeCode(p.sku)];
}

export function buildPreview(file: ParsedFile, products: Product[]): StockPreview {
  const byKey = new Map<string, FileRow[]>();
  for (const r of file.rows) byKey.set(r.key, [...(byKey.get(r.key) ?? []), r]);

  const used = new Set<FileRow>();
  const changes: StockChange[] = [];
  const failed: StockPreview['failed'] = [];
  const notInFile: StockPreview['notInFile'] = [];
  let unchanged = 0;

  for (const p of products) {
    const rows = productKeys(p).flatMap((k) => byKey.get(k) ?? []);
    if (!rows.length) {
      if (p.is_visible) notInFile.push({ id: p.id, sku: p.sku, name: p.name });
      continue;
    }
    rows.forEach((r) => used.add(r));
    const readable = rows.filter((r) => r.qty !== null);
    rows
      .filter((r) => r.qty === null)
      .forEach((r) => failed.push({ line: r.line, code: r.code, name: `${r.name} → ${p.sku}`, reason: r.qtyProblem ?? 'nečitljiva vrednost' }));
    if (!readable.length) continue;
    const newQty = readable.reduce((s, r) => s + (r.qty ?? 0), 0);
    const newState = stateFor(p, newQty);
    if (newQty === p.stock_qty && newState === p.stock_state) {
      unchanged++;
      continue;
    }
    changes.push({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      oldQty: p.stock_qty,
      newQty,
      oldState: p.stock_state,
      newState,
      codes: rows.map((r) => r.code),
    });
  }

  const notInShop = file.rows.filter((r) => !used.has(r));
  const noQuantities = file.rows.length > 0 && file.rows.every((r) => r.qty === null);
  const rowsMatched = used.size;
  const status: StockPreview['status'] =
    file.error || noQuantities || rowsMatched === 0 ? 'failed' : failed.length || notInFile.length ? 'warnings' : 'success';

  return {
    rowsRead: file.rows.length,
    rowsMatched,
    changes,
    unchanged,
    toOut: changes.filter((c) => c.oldState === 'in_stock' && c.newState !== 'in_stock'),
    backIn: changes.filter((c) => c.oldState !== 'in_stock' && c.newState === 'in_stock'),
    failed,
    notInFile,
    notInShop,
    noQuantities,
    status,
  };
}

/** Reads the uploaded file in the browser. SheetJS is loaded only when needed. */
export async function readStockFile(file: File): Promise<ParsedFile> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: null, blankrows: false });
  return parseSheet(rows);
}
