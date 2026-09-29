#!/usr/bin/env node
/**
 * Reads the visible catalogue from Supabase and writes src/data/catalog.json,
 * which the Astro pages are built from. Runs before every build (npm "prebuild").
 *
 * If Supabase can't be reached, the existing catalog.json (last good snapshot) is kept,
 * so a network problem never breaks the site. Set CATALOG_REQUIRED=1 to fail instead.
 */
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';

const URL_ = 'https://cgaoexscwzjgznphhpzw.supabase.co';
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_KiXZbOE340DwX9H7mA_QLg_D1mukd_I';
const out = new URL('../src/data/catalog.json', import.meta.url);
const imageDir = new URL('../public/images/partner/', import.meta.url);

/**
 * Partner photos are copied to /images/partner/ so the shop never hot-links decorambient.com
 * (faster, and photos keep working if their site changes). Existing files are reused.
 * If a download fails, the original URL is kept.
 */
async function localizeImage(src) {
  if (!/^https?:\/\//.test(src)) return src;
  const name = decodeURIComponent(new URL(src).pathname.split('/').pop() ?? '').replace(/[^a-zA-Z0-9._-]/g, '-');
  if (!name) return src;
  const file = new URL(name, imageDir);
  try {
    await stat(file);
    return `images/partner/${name}`;
  } catch {}
  try {
    const res = await fetch(src, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(String(res.status));
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
    return `images/partner/${name}`;
  } catch (err) {
    console.warn(`image kept remote (${err.message}): ${src}`);
    return src;
  }
}

async function get(path) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    headers: { apikey: KEY },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

try {
  const [categories, products, settings] = await Promise.all([
    get('categories?select=slug,name,sort_order,show_in_menu,description,intro,seo_title,seo_description,parent:parent_id(slug)&order=sort_order'),
    get(
      'products?select=sku,slug,name,kicker,summary,description_html,specs,maintenance,badge_label,badge_tone,sale_price,stock_state,stock_qty,' +
        'is_featured,sort_order,partner_url,seo_title,seo_description,category:category_id(slug),images:product_images(src,alt,sort_order)' +
        '&order=sort_order,name',
    ),
    get('settings?select=key,value'),
  ]);
  await mkdir(imageDir, { recursive: true });
  for (const p of products) {
    for (const img of p.images ?? []) img.src = await localizeImage(img.src);
  }
  const catalog = {
    generatedAt: new Date().toISOString(),
    source: 'supabase',
    settings: Object.fromEntries(settings.map((s) => [s.key, s.value])),
    categories: categories.map((c) => ({
      slug: c.slug,
      name: c.name,
      parentSlug: c.parent?.slug ?? null,
      sort: c.sort_order,
      showInMenu: c.show_in_menu,
      description: c.description,
      intro: c.intro,
      seoTitle: c.seo_title,
      seoDescription: c.seo_description,
    })),
    products: products.map((p) => ({
      sku: p.sku,
      slug: p.slug,
      name: p.name,
      categorySlug: p.category?.slug ?? null,
      kicker: p.kicker,
      summary: p.summary,
      descriptionHtml: p.description_html,
      specs: p.specs ?? [],
      maintenance: p.maintenance,
      badge: p.badge_label ? { label: p.badge_label, tone: p.badge_tone } : null,
      price: p.sale_price,
      stock: p.stock_state,
      stockQty: p.stock_qty,
      featured: p.is_featured,
      sort: p.sort_order,
      partnerUrl: p.partner_url,
      seoTitle: p.seo_title,
      seoDescription: p.seo_description,
      images: (p.images ?? []).sort((a, b) => a.sort_order - b.sort_order).map(({ src, alt }) => ({ src, alt })),
    })),
  };
  await writeFile(out, JSON.stringify(catalog, null, 1) + '\n');
  console.log(`catalog: ${catalog.categories.length} categories, ${catalog.products.length} products from Supabase`);
} catch (err) {
  if (process.env.CATALOG_REQUIRED === '1') throw err;
  const existing = JSON.parse(await readFile(out, 'utf8').catch(() => '{}'));
  console.warn(`catalog: Supabase not reachable (${err.message}); using snapshot from ${existing.generatedAt ?? 'never'}`);
}
