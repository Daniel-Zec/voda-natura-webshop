/**
 * Homepage content. Prices and products come from the Knowledge Base (Decor Ambient
 * prices with VAT, 23 Sep 2026). This file is temporary: in the next step products and
 * prices load from Supabase, and texts become editable in the admin panel.
 */
import { site } from '../config/site';
import { routes, url } from '../lib/url';
import type { CartridgeSummary, CategorySummary, FaqItem, ProductSummary } from './types';
import { getProductBySku, productsIn, products, toCartridge, toSummary } from '../lib/catalog';

const img = (name: string) => url(`images/products/${name}.webp`);

export const categories: CategorySummary[] = [
  {
    slug: 'filteri-za-pijacu-vodu',
    name: 'Voda za piće',
    description: 'Reverzna osmoza i kuhinjski filteri',
    image: { src: img('ro-6-wfu-reverzna-osmoza'), alt: 'Sistem reverzne osmoze ispod sudopere' },
  },
  {
    slug: 'filteri-za-celu-kucu',
    name: 'Cela kuća',
    description: 'Pesak, rđa i hlor na ulazu vode',
    image: { src: img('filter-za-celu-kucu'), alt: 'Filter za celu kuću na ulazu vode' },
  },
  {
    slug: 'omeksivaci-vode',
    name: 'Omekšivači',
    description: 'Protiv kamenca u tvrdoj vodi',
    image: { src: img('ws-20-primo-omeksivac-vode'), alt: 'Omekšivač vode WS-20 Primo' },
  },
  {
    slug: 'tus-i-kucni-aparati',
    name: 'Tuš i aparati',
    description: 'Tuš, veš i sudo mašina',
    image: { src: img('wfsh-s-filter-za-tus'), alt: 'Filter za tuš WFSH-S' },
  },
  {
    slug: 'ulosci',
    name: 'Ulošci',
    description: 'Zamena na 6 meseci, sve veličine',
    image: { src: img('bl-10-ugljeni-blok-ulozak'), alt: 'Uložak od aktivnog uglja BL 10' },
  },
];

/** Homepage systems: products marked "featured" in the admin panel (Supabase is_featured), in their sort order. */
export const featuredProducts: ProductSummary[] = products
  .filter((p) => p.featured)
  .sort((a, b) => a.sort - b.sort)
  .map(toSummary);

/** Cartridge reorder tiles: the most asked-for cartridges (by SKU). */
const cartridgeTiles: [string, string][] = [
  ['BL-10', 'Ugljeni blok · hlor, ukus'],
  ['STO-10', 'Za FSCNT · 2 stepena'],
  ['WFST', 'Veš i sudo mašina'],
];
export const popularCartridges: CartridgeSummary[] = cartridgeTiles
  .map(([sku, text]) => {
    const p = getProductBySku(sku);
    return p ? toCartridge(p, text) : undefined;
  })
  .filter((c): c is CartridgeSummary => Boolean(c));

/** Number of cartridges in the shop, for "Svi ulošci (N)" */
export const cartridgeCount = productsIn('ulosci').length;

/** Quick links under "Znam šta tražim" */
export const cartridgeChips = [
  { label: 'BL 10 – ugljeni blok', href: routes.product('bl-10-ugljeni-blok-ulozak') },
  { label: 'STO 10', href: routes.product('sto-10-ulozak') },
  { label: 'PS – sediment', href: routes.category('sedimentni-ulosci') },
  { label: 'TLC 75 membrana', href: routes.product('tlc-75-membrana') },
  { label: 'Ugljeni ulošci', href: routes.category('ugljeni-ulosci') },
];

/**
 * FAQ. Updated with the 29 Sep 2026 decisions: no shipping price on the site,
 * no free shipping, no tracking promise (tracking is still open with Decor Ambient).
 */
export const homeFaq: FaqItem[] = [
  {
    question: 'Kako se plaća porudžbina?',
    answer: 'Pouzećem: gotovinom kuriru kada paket stigne. Ne plaćate ništa unapred i ne treba vam kartica.',
  },
  {
    question: 'Koliko košta dostava?',
    answer: `Šaljemo ${site.delivery.courier} kurirskom službom. Cena zavisi od težine i veličine paketa, pa je ne naplaćujemo na sajtu: troškove dostave plaćate kuriru prilikom preuzimanja.`,
  },
  {
    question: 'Koliko se čeka na isporuku?',
    answer: `Proizvodi koji su na stanju stižu za ${site.delivery.estimate}. Uređaji koji se poručuju iz uvoza čekaju se do 3–4 meseca i to uvek piše na stranici proizvoda.`,
  },
  {
    question: 'Da li mogu sam da ugradim filter?',
    answer:
      'Kuhinjski filter na slavinu i filter za tuš – da. Za reverznu osmozu i sisteme za celu kuću preporučujemo vodoinstalatera, jer garancija važi uz stručnu ugradnju. Pomažemo telefonom.',
  },
  {
    question: 'Koliko često se menjaju ulošci?',
    answer:
      'Većina na 6 meseci, membrana reverzne osmoze na 3 godine. Na stranici svakog proizvoda piše godišnji trošak održavanja.',
  },
];
