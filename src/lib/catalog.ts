/**
 * Catalogue access for pages. Data comes from src/data/catalog.json, written before every
 * build by scripts/fetch-catalog.mjs from Supabase (falls back to the last snapshot).
 */
import raw from '../data/catalog.json';
import type { StockState } from '../components/ui/StockStatus/StockStatus';
import type { BadgeTone } from '../components/ui/Badge/Badge';
import type { CartridgeSummary, CategorySummary, ProductSummary } from '../data/types';
import { routes, url } from './url';
import type { CartProduct } from './cartStore';

export interface CatalogCategory {
  slug: string;
  name: string;
  parentSlug: string | null;
  sort: number;
  showInMenu: boolean;
  description: string | null;
  intro: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface CatalogProduct {
  sku: string;
  slug: string;
  name: string;
  categorySlug: string | null;
  kicker: string | null;
  summary: string | null;
  descriptionHtml: string | null;
  specs: { label: string; value: string }[];
  maintenance: string | null;
  badge: { label: string; tone: string } | null;
  price: number;
  stock: 'in_stock' | 'out_of_stock' | 'made_to_order';
  stockQty: number | null;
  featured: boolean;
  sort: number;
  partnerUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  images: { src: string; alt: string }[];
}

interface Catalog {
  generatedAt: string;
  source: string;
  settings: Record<string, unknown>;
  categories: CatalogCategory[];
  products: CatalogProduct[];
}

const catalog = raw as unknown as Catalog;

export const categories = [...catalog.categories].sort((a, b) => a.sort - b.sort);
export const products = catalog.products;
export const catalogInfo = { generatedAt: catalog.generatedAt, source: catalog.source };

const stockMap: Record<CatalogProduct['stock'], StockState> = {
  in_stock: 'inStock',
  out_of_stock: 'outOfStock',
  made_to_order: 'madeToOrder',
};
export const stockState = (p: CatalogProduct): StockState => stockMap[p.stock];

/** Local images live under /public/images; partner images are absolute URLs. */
export const imageSrc = (src: string) => (/^https?:\/\//.test(src) ? src : url(src));

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const childrenOf = (slug: string | null) => categories.filter((c) => c.parentSlug === slug);

/** This category and every category below it. */
export function descendants(slug: string): string[] {
  return [slug, ...childrenOf(slug).flatMap((c) => descendants(c.slug))];
}

/** Products in a category, including its subcategories. */
export function productsIn(slug: string): CatalogProduct[] {
  const slugs = new Set(descendants(slug));
  return products.filter((p) => p.categorySlug && slugs.has(p.categorySlug));
}

/** Home › parent › … › category */
export function categoryTrail(slug: string | null): CatalogCategory[] {
  const trail: CatalogCategory[] = [];
  let current = slug ? getCategory(slug) : undefined;
  while (current) {
    trail.unshift(current);
    current = current.parentSlug ? getCategory(current.parentSlug) : undefined;
  }
  return trail;
}

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getProductBySku = (sku: string) => products.find((p) => p.sku === sku);

/** Shape used by ProductCard. */
export function toSummary(p: CatalogProduct): ProductSummary {
  const img = p.images[0];
  return {
    sku: p.sku,
    slug: p.slug,
    name: p.name,
    kicker: p.kicker ?? undefined,
    summary: p.summary ?? '',
    price: p.price,
    stock: stockState(p),
    image: { src: img ? imageSrc(img.src) : url('images/brand/vodanatura-logo.svg'), alt: img?.alt ?? p.name },
    badge: p.badge ? { label: p.badge.label, tone: p.badge.tone as BadgeTone } : undefined,
    maintenance: p.maintenance ?? undefined,
  };
}

/** Shape used by CartridgeCard. */
export function toCartridge(p: CatalogProduct, description?: string): CartridgeSummary {
  const s = toSummary(p);
  return { sku: s.sku, slug: s.slug, name: shortName(p.name), description: description ?? p.kicker ?? '', price: s.price, image: s.image };
}

/** "BL 10 – Uložak od aktivnog uglja…" → "BL 10" */
export const shortName = (name: string) => name.split(/\s[–-]\s/)[0].trim();

/** First image of the first product in a category, for category tiles without their own image. */
export function categoryImage(slug: string): CategorySummary['image'] {
  const p = productsIn(slug).find((x) => x.images.length);
  return p ? { src: imageSrc(p.images[0].src), alt: p.images[0].alt } : { src: url('images/brand/vodanatura-logo.svg'), alt: '' };
}

export const setting = <T = string>(key: string, fallback: T): T => (catalog.settings[key] as T) ?? fallback;

/** Every visible product by SKU, for the cart and checkout islands (current price and stock at publish time). */
export function cartCatalog(): Record<string, CartProduct> {
  return Object.fromEntries(
    products.map((p) => {
      const s = toSummary(p);
      return [p.sku, { sku: p.sku, name: p.name, href: routes.product(p.slug), image: s.image, price: p.price, stock: s.stock }];
    }),
  );
}
