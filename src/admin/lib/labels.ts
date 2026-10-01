import { formatNumber } from '../../lib/format';
import type { Catalog, Category, ContactStatus, ContactTopic, OrderStatus, PriceMode, Product, StockState } from './types';

export type Tone = 'info' | 'success' | 'warning' | 'error' | 'neutral' | 'brand';

export const orderStatusLabel: Record<OrderStatus, string> = {
  new: 'Nova',
  sent_to_partner: 'Poslato DA',
  processing: 'U obradi',
  shipped: 'Poslato kuriru',
  delivered: 'Isporučeno',
  completed: 'Završeno',
  refused: 'Odbijeno',
  returned: 'Vraćeno',
  cancelled: 'Otkazano',
};

export const orderStatusTone: Record<OrderStatus, Tone> = {
  new: 'brand',
  sent_to_partner: 'info',
  processing: 'warning',
  shipped: 'info',
  delivered: 'success',
  completed: 'neutral',
  refused: 'error',
  returned: 'error',
  cancelled: 'neutral',
};

/** Allowed next statuses (Admin Panel Guide §5). */
export const nextStatuses: Record<OrderStatus, OrderStatus[]> = {
  new: ['sent_to_partner', 'cancelled'],
  sent_to_partner: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'refused'],
  delivered: ['completed', 'returned'],
  completed: ['returned'],
  refused: [],
  returned: [],
  cancelled: [],
};

export const orderStatuses = Object.keys(orderStatusLabel) as OrderStatus[];

export const stockLabel: Record<StockState, string> = {
  in_stock: 'Na stanju',
  out_of_stock: 'Nema na stanju',
  made_to_order: 'Po porudžbini',
};
export const stockTone: Record<StockState, Tone> = { in_stock: 'success', out_of_stock: 'error', made_to_order: 'warning' };

export const priceModeLabel: Record<PriceMode, string> = { auto: 'Auto', fixed: 'Fiksna', percent: 'Procenat' };

export const commissionStatusLabel = { pending: 'Na čekanju', earned: 'Zarađeno', cancelled: 'Poništeno' } as const;
export const commissionStatusTone = { pending: 'warning', earned: 'success', cancelled: 'neutral' } as const;

export const rsd = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${formatNumber(v)} RSD`);
export const num = (v: number | null | undefined) => (v === null || v === undefined ? '—' : formatNumber(v));
export const money2 = (v: number) =>
  `${v.toLocaleString('sr-Latn-RS', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} RSD`;
export const pct = (v: number | null | undefined) =>
  v === null || v === undefined ? '—' : `${v.toLocaleString('sr-Latn-RS', { maximumFractionDigits: 2 })} %`;

export function date(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}.`;
}
export function dateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${date(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
export function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - Date.parse(iso)) / 86400000);
}

export function settingNumber(settings: Record<string, unknown>, key: string, fallback: number): number {
  const v = settings[key];
  const n = typeof v === 'number' ? v : Number(v);
  return v === null || v === undefined || Number.isNaN(n) ? fallback : n;
}
export function settingText(settings: Record<string, unknown>, key: string): string {
  const v = settings[key];
  return v === null || v === undefined ? '' : String(v);
}

/** "Voda za piće › Reverzna osmoza" */
export function categoryPath(categories: Category[], id: number | null): string {
  if (!id) return '—';
  const c = categories.find((x) => x.id === id);
  if (!c) return '—';
  const parent = c.parent_id ? categories.find((x) => x.id === c.parent_id) : null;
  return parent && parent.parent_id ? `${parent.name} › ${c.name}` : c.name;
}

export type CommissionSource = 'product' | 'category' | 'parent' | 'default';
export const commissionSourceLabel: Record<CommissionSource, string> = {
  product: 'proizvod',
  category: 'kategorija',
  parent: 'nadkategorija',
  default: 'podrazumevano',
};

/** Commission % for a product and where it comes from: product → category → parent category → default. */
export function commissionFor(catalog: Pick<Catalog, 'rules' | 'categories' | 'settings'>, p: Pick<Product, 'id' | 'category_id'>): { pct: number | null; source: CommissionSource } {
  const byProduct = catalog.rules.find((r) => r.product_id === p.id);
  if (byProduct) return { pct: byProduct.pct, source: 'product' };
  const byCat = catalog.rules.find((r) => r.category_id !== null && r.category_id === p.category_id);
  if (byCat) return { pct: byCat.pct, source: 'category' };
  const parentId = catalog.categories.find((c) => c.id === p.category_id)?.parent_id;
  const byParent = parentId ? catalog.rules.find((r) => r.category_id === parentId) : undefined;
  if (byParent) return { pct: byParent.pct, source: 'parent' };
  const d = catalog.settings.commission_default_pct;
  return { pct: d === null || d === undefined || d === '' ? null : Number(d), source: 'default' };
}

/** Sale price as the database computes it (for previews before saving). */
export function previewPrice(partnerPrice: number, mode: PriceMode, value: number | null, rounding = 10): number {
  if (mode === 'fixed') return Math.round(value ?? partnerPrice);
  if (mode === 'percent') return Math.round((partnerPrice * (1 + (value ?? 0) / 100)) / rounding) * rounding;
  return partnerPrice;
}

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // Semicolon + BOM: opens correctly in Excel with Serbian regional settings.
  const csv = '﻿' + rows.map((r) => r.map(esc).join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export const contactTopicLabel: Record<ContactTopic, string> = {
  izbor: 'Izbor filtera',
  ugradnja: 'Ugradnja',
  porudzbina: 'Porudžbina',
  reklamacija: 'Reklamacija',
  drugo: 'Drugo',
};
export const contactStatusLabel: Record<ContactStatus, string> = { new: 'Nova', answered: 'Odgovoreno', forwarded: 'Prosleđeno', spam: 'Spam' };
export const contactStatusTone: Record<ContactStatus, Tone> = { new: 'brand', answered: 'success', forwarded: 'info', spam: 'neutral' };
