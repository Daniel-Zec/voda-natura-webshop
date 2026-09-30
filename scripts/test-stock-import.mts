/**
 * Tests for the DA stock import (src/admin/lib/stockImport.ts). No browser, no database.
 * Run: npm run test:stock
 * The sheet below copies the layout of DA's "roba spisak" export (two header rows,
 * supplier suffixes, an item-count line at the bottom). Codes are real, quantities invented.
 */
import assert from 'node:assert/strict';
import { buildPreview, parseQty, parseSheet, stockKey } from '../src/admin/lib/stockImport.ts';

const H1 = ['ARTIKAL', null, null, null, null, null, 'STANJE', null, null, null, 'IZBOR', null, 'NABAVNE', null, null, null, 'CENOVNIK', null, null, 'ULAZ', 'IZLAZ', 'OČEKIVANE PROMENE'];
const H2 = ['Šifra artikla', 'Naziv artikla', 'Grupa artikla', 'JM', 'Proizvođač', 'Aktivna?', 'Količina', 'Slobodna količina', 'Vrednost zaliha', 'Magacinska cena', 'Izbor', 'Komada', 'Vrednost', 'Srednja cena', 'Zadnja NC', 'Promena NC%', 'VP marža (%)', 'VP cenovnik', 'MP cenovnik', 'Količina', 'Količina', 'Rezervisano', 'Ulaz', 'Izlaz'];
const row = (code: string, name: string, total: unknown, free: unknown, reserved: unknown = 0) => {
  const r: unknown[] = Array(24).fill(null);
  r[0] = code; r[1] = name; r[6] = total; r[7] = free; r[21] = reserved;
  return r;
};
const sheet = [
  H1, H2,
  row('BL-10', 'ULOŽAK AKT.UGALJ 10"', 5, 4, 1),
  row('BL-10  KL', 'ULOŽAK AKT. UGALJ 10 INČA', 3, 3),
  row('BL 20BB  DW', 'ULOŽAK BB AKT. UGALJ 20 INČA', 2, 2),
  row('BL-20BB', 'ULOŽAK BB AKT. UGALJ 20"', 1, '1,00'),
  row('WFU', 'KUĆIŠTE UNIVERZALNO 10"', 0, 0),
  row('RO 6 12 MP', 'RO 6 SA PUMPOM', null, '', null),
  row('FCDC  DW', 'SLAVINA', 4, '', 1),
  row('0404964', 'INOX KORPA 1 1/4"', 9, 9),
  row('MATTEO', 'MATTEO', 0, 0),
  [217],
];

const product = (id: number, sku: string, extra: object = {}) => ({
  id, sku, name: sku, is_visible: true, made_to_order: false, stock_qty: 1, stock_state: 'in_stock', internal: { stock_codes: [] as string[] }, ...extra,
});
const products = [
  product(7, 'FCDC'),
  product(1, 'BL-10'),
  product(2, 'BL-20BB'),
  product(3, 'WFU10', { internal: { stock_codes: ['WFU'] } }),
  product(4, 'RO6-MP', { internal: { stock_codes: ['RO612MP'] } }),
  product(5, 'MATTEO', { made_to_order: true, stock_qty: null, stock_state: 'made_to_order' }),
  product(6, 'CW929'),
] as never[];

assert.equal(stockKey('BL 20BB  DW'), 'BL20BB');
assert.equal(stockKey('WF UP 1    KOM'), 'WFUP1');
assert.equal(stockKey('C-2500 U'), 'C2500');
assert.equal(parseQty('1.234,00').qty, 1234);
assert.equal(parseQty('').qty, null);
assert.equal(parseQty(-2).qty, 0);

const parsed = parseSheet(sheet);
assert.equal(parsed.qtySource, 'free');
assert.equal(parsed.rows.length, 9, 'item-count line is skipped');

const pv = buildPreview(parsed, products);
const by = (sku: string) => pv.changes.find((c) => c.sku === sku);
assert.equal(by('BL-10')?.newQty, 7, 'BL-10 + BL-10 KL are added up (free quantity)');
assert.equal(by('BL-20BB')?.newQty, 3, 'suffix rows and "1,00" are read');
assert.equal(by('WFU10')?.newState, 'out_of_stock', 'saved DA code WFU matches, 0 = out of stock');
assert.equal(by('MATTEO')?.newState, 'made_to_order', 'made-to-order at 0 stays orderable (not "out of stock")');
assert.equal(by('FCDC')?.newQty, 3, 'empty free quantity falls back to total minus reserved');
assert.equal(pv.failed.length, 1, 'RO 6 12 MP has an empty quantity');
assert.equal(pv.failed[0].code, 'RO 6 12 MP');
assert.deepEqual(pv.notInFile.map((p) => p.sku), ['CW929']);
assert.equal(pv.notInShop.length, 1, 'INOX KORPA is not a shop product');
assert.equal(pv.status, 'warnings');

// The first real sample (30 Sep 2026) had every quantity column empty.
const empty = parseSheet([H1, H2, row('BL-10', 'X', null, null, null), row('WFU', 'Y', '', '', '')]);
const pv2 = buildPreview(empty, products);
assert.equal(pv2.noQuantities, true);
assert.equal(pv2.status, 'failed');
assert.equal(pv2.changes.length, 0);

assert.ok(parseSheet([['foo'], ['bar']]).error, 'missing header is reported');
console.log('stock import: all tests passed');
