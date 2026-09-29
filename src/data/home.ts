/**
 * Homepage content. Prices and products come from the Knowledge Base (Decor Ambient
 * prices with VAT, 23 Sep 2026). This file is temporary: in the next step products and
 * prices load from Supabase, and texts become editable in the admin panel.
 */
import { site } from '../config/site';
import { routes, url } from '../lib/url';
import type { CartridgeSummary, CategorySummary, FaqItem, ProductSummary } from './types';

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

export const featuredProducts: ProductSummary[] = [
  {
    sku: 'RO6',
    slug: 'ro-6-wfu-reverzna-osmoza',
    name: 'RO 6 WFU – reverzna osmoza',
    kicker: 'Ispod sudopere · 6 stepeni',
    summary: 'Do 284 l vode za piće dnevno. Uklanja do 98% rastvorenih materija.',
    price: 56899,
    stock: 'inStock',
    image: { src: img('ro-6-wfu-reverzna-osmoza'), alt: 'RO 6 WFU sistem reverzne osmoze sa rezervoarom' },
    badge: { label: 'Najbolje za piće', tone: 'info' },
    // Cartridge codes per stage still open with Decor Ambient (VODANATURA-33); membrane cost is known.
    maintenance: 'Membrana na 3 godine, oko 2.170 RSD godišnje',
  },
  {
    sku: 'FSCNT',
    slug: 'fscnt-kuhinjski-filter',
    name: 'FSCNT – kuhinjski filter',
    kicker: 'Na slavinu · bez bušenja',
    summary: 'Uklanja pesak, hlor i organska jedinjenja. Bolji ukus i miris vode.',
    price: 6422,
    stock: 'inStock',
    image: { src: img('fscnt-kuhinjski-filter'), alt: 'FSCNT kuhinjski filter na slavini' },
    badge: { label: 'Najpovoljniji start', tone: 'natura' },
    maintenance: '2.438 RSD godišnje (STO 10)',
  },
  {
    sku: 'WS-20',
    slug: 'ws-20-primo-omeksivac-vode',
    name: 'WS-20 Primo – omekšivač',
    kicker: 'Cela kuća · automatska regeneracija',
    summary: 'Štiti bojler, mašine i slavine od kamenca. Protok 1,2 m³/h.',
    price: 148104,
    stock: 'inStock',
    image: { src: img('ws-20-primo-omeksivac-vode'), alt: 'WS-20 Primo omekšivač vode za celu kuću' },
    badge: { label: 'Za kuće', tone: 'sand' },
    maintenance: 'so, 3–4,5 kg po regeneraciji',
  },
  {
    sku: 'WFSH-S',
    slug: 'wfsh-s-filter-za-tus',
    name: 'WFSH-S – filter za tuš',
    kicker: 'Tuš · nije za piće',
    summary: 'Manje kamenca na tušu i manje hlora koji isušuje kožu.',
    price: 3541,
    stock: 'inStock',
    image: { src: img('wfsh-s-filter-za-tus'), alt: 'WFSH-S hromirani filter za tuš' },
    maintenance: '2.210 RSD godišnje',
  },
];

export const popularCartridges: CartridgeSummary[] = [
  {
    sku: 'BL10',
    slug: 'bl-10-ugljeni-blok-ulozak',
    name: 'BL 10',
    description: 'Ugljeni blok · hlor, ukus',
    price: 606,
    image: { src: img('bl-10-ugljeni-blok-ulozak'), alt: 'BL 10 uložak od aktivnog uglja' },
  },
  {
    sku: 'STO10',
    slug: 'sto-10-ulozak',
    name: 'STO 10',
    description: 'Za FSCNT · 2 stepena',
    price: 1219,
    image: { src: img('sto-10-ulozak'), alt: 'STO 10 uložak za kuhinjski filter FSCNT' },
  },
  {
    sku: 'WFST',
    slug: 'wfst-filter-za-ves-masinu',
    name: 'WFST',
    description: 'Veš i sudo mašina',
    price: 1813,
    image: { src: img('wfst-filter-za-ves-masinu'), alt: 'WFST filter za veš i sudo mašinu' },
  },
];

/** Quick links under "Znam šta tražim" */
export const cartridgeChips = [
  { label: 'BL 10 – ugljeni blok', href: routes.product('bl-10-ugljeni-blok-ulozak') },
  { label: 'STO 10', href: routes.product('sto-10-ulozak') },
  { label: 'PS – sediment', href: routes.product('ps-sedimentni-ulozak') },
  { label: 'TLC 75 membrana', href: routes.product('tlc-75-membrana') },
  { label: 'Big Blue 20"', href: routes.category('ulosci/big-blue') },
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
