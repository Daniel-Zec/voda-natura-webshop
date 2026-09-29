import type { StockState } from '../components/ui/StockStatus/StockStatus';
import type { BadgeTone } from '../components/ui/Badge/Badge';

/**
 * Product as the shop shows it. Field names mirror the planned Supabase `products`
 * table, so the static data below can be swapped for database rows without
 * touching components.
 */
export interface ProductSummary {
  sku: string;
  slug: string;
  name: string;
  /** Short "where / what" line above the name, e.g. "Ispod sudopere · 6 stepeni" */
  kicker?: string;
  /** One or two benefit sentences (function only, no health claims) */
  summary: string;
  /** Sale price in RSD, VAT included */
  price: number;
  stock: StockState;
  image: { src: string; alt: string };
  badge?: { label: string; tone: BadgeTone };
  /** "Održavanje: …" line — the yearly running cost */
  maintenance?: string;
}

export interface CartridgeSummary {
  sku: string;
  slug: string;
  name: string;
  /** e.g. "Ugljeni blok · hlor, ukus" */
  description: string;
  price: number;
  image: { src: string; alt: string };
}

export interface CategorySummary {
  slug: string;
  name: string;
  description: string;
  image: { src: string; alt: string };
}

export interface FaqItem {
  question: string;
  answer: string;
}
