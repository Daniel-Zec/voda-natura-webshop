/**
 * Sample data for the admin panel: used for screenshots, design review and browser tests
 * where Supabase can't be reached. Loaded only in builds with PUBLIC_ADMIN_DEMO=true.
 * Products come from the committed catalogue snapshot; orders and customers are invented.
 */
import catalogJson from '../../data/catalog.json';
import type { AdminApi } from './api';
import type {
  ContactMessage,
  AuthStep,
  Banner,
  Category,
  CommissionLine,
  CommissionRule,
  Customer,
  EmailLogRow,
  EmailTemplate,
  Order,
  OrderStatus,
  PriceHistoryRow,
  PriceMode,
  Product,
  ProductDocument,
  Settings,
  StatusHistoryRow,
  StockImportRow,
} from './types';

type CatalogJson = {
  categories: { slug: string; name: string; parentSlug: string | null; sort: number }[];
  products: {
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
    stock: Product['stock_state'];
    stockQty: number | null;
    featured: boolean;
    sort: number;
    partnerUrl: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    images: { src: string; alt: string }[];
  }[];
};
const cat = catalogJson as unknown as CatalogJson;

// Deterministic pseudo-random numbers, so screenshots are stable.
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const daysAgo = (d: number, h = 10) => new Date(Date.now() - d * 86400000 - h * 3600000).toISOString();
const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms));

const categories: Category[] = cat.categories.map((c, i) => ({
  id: i + 1,
  slug: c.slug,
  name: c.name,
  parent_id: null,
  sort_order: c.sort,
  is_visible: true,
}));
cat.categories.forEach((c, i) => {
  if (c.parentSlug) categories[i].parent_id = categories.find((x) => x.slug === c.parentSlug)?.id ?? null;
});

let imageId = 1;
const products: Product[] = cat.products.map((p, i) => ({
  id: i + 1,
  sku: p.sku,
  slug: p.slug,
  name: p.name,
  category_id: categories.find((c) => c.slug === p.categorySlug)?.id ?? null,
  kicker: p.kicker,
  summary: p.summary,
  description_html: p.descriptionHtml,
  specs: p.specs ?? [],
  maintenance: p.maintenance,
  badge_label: p.badge?.label ?? null,
  badge_tone: p.badge?.tone ?? null,
  partner_price: p.price,
  price_mode: 'auto',
  price_override: null,
  sale_price: p.price,
  stock_state: p.stock,
  stock_qty: p.stockQty,
  stock_updated_at: daysAgo(9),
  made_to_order: p.stock === 'made_to_order',
  is_visible: true,
  is_featured: p.featured,
  sort_order: p.sort,
  content_status: 'partner_copy',
  partner_url: p.partnerUrl,
  seo_title: p.seoTitle,
  seo_description: p.seoDescription,
  primary_keyword: null,
  weight_kg: null,
  dimensions_cm: null,
  updated_at: daysAgo(1),
  images: p.images.map((img, j) => ({ id: imageId++, product_id: i + 1, src: img.src, alt: img.alt, sort_order: j, is_primary: j === 0 })),
  internal: { partner_name: p.name, partner_description_html: null, data_notes: null, stock_codes: [] },
}));
const bySku = (sku: string) => products.find((p) => p.sku === sku);
const wfu = bySku('WFU10');
if (wfu) {
  wfu.internal.stock_codes = ['WFU'];
  wfu.internal.data_notes = 'Šifra na sajtu DA je bila „Uneti pravu šifru”; u knjigovodstvu je WFU.';
}
const bl = bySku('BL-10');
if (bl) {
  bl.price_mode = 'fixed';
  bl.price_override = bl.partner_price - 20;
  bl.sale_price = bl.partner_price - 20;
}

function recalc(p: Product) {
  const round = 10;
  p.sale_price =
    p.price_mode === 'fixed'
      ? Math.round(p.price_override ?? p.partner_price)
      : p.price_mode === 'percent'
        ? Math.round((p.partner_price * (1 + (p.price_override ?? 0) / 100)) / round) * round
        : p.partner_price;
}

const settings: Settings = {
  commission_default_pct: 10,
  commission_earn_days: 7,
  partner_order_email: null,
  order_sender_email: 'narudzbine@vodanatura.com',
  email_test_mode: true,
  admin_notify_email: 'daniel.zec@vodanatura.com',
  price_rounding_rsd: 10,
  shop_phone: '[TELEFON]',
  shop_hours: 'Ponedeljak–petak, 8–16 h',
  delivery_estimate: 'oko 4 radna dana',
  installation_phone: '[TELEFON DECOR AMBIENT]',
  installation_price: '[CENA UGRADNJE]',
  social_instagram_url: '',
  social_facebook_url: '',
  order_stuck_days: 3,
  stock_import_warn_days: 7,
  price_sync_last_run: null,
  price_sync_status: null,
  admin_idle_minutes: 30,
};

let ruleId = 1;
let rules: CommissionRule[] = [];
const softeners = categories.find((c) => c.slug.includes('omeksiv'));
if (softeners) rules.push({ id: ruleId++, category_id: softeners.id, product_id: null, pct: 8 });

function pctFor(productId: number): number {
  const p = products.find((x) => x.id === productId);
  const r =
    rules.find((x) => x.product_id === productId) ??
    rules.find((x) => x.category_id === p?.category_id) ??
    rules.find((x) => x.category_id === categories.find((c) => c.id === p?.category_id)?.parent_id);
  return r?.pct ?? Number(settings.commission_default_pct ?? 0);
}

// Orders
const people = [
  ['Jelena', 'Petrović', 'Novi Sad', '21000'],
  ['Marko', 'Jovanović', 'Subotica', '24000'],
  ['Ana', 'Nikolić', 'Beograd', '11000'],
  ['Milan', 'Stojanović', 'Niš', '18000'],
  ['Ivana', 'Ilić', 'Kragujevac', '34000'],
  ['Dragan', 'Kovačević', 'Sombor', '25000'],
  ['Milica', 'Pavlović', 'Zrenjanin', '23000'],
  ['Nenad', 'Marković', 'Čačak', '32000'],
  ['Tamara', 'Đorđević', 'Beograd', '11070'],
  ['Stefan', 'Popović', 'Subotica', '24000'],
];
const streets = ['Bulevar oslobođenja', 'Karađorđeva', 'Njegoševa', 'Cara Dušana', 'Zmaj Jovina', 'Kralja Petra I'];
const systems = products.filter((p) => ['RO6', 'RO6-MP', 'FSCNT', 'DW8', 'WS-20', 'WF PRE 34'].includes(p.sku));
const carts = products.filter((p) => ['BL-10', 'PP-5M', 'PS-5M', 'STO-10', 'L-MIN-Q', 'L-GAC-Q', 'TLC75', 'BL-20BB', 'IR-20BB'].includes(p.sku));

const orders: Order[] = [];
const history: StatusHistoryRow[] = [];
const emails: EmailLogRow[] = [];
let itemId = 1;
let histId = 1;
let mailId = 1;
const flow: OrderStatus[] = ['new', 'sent_to_partner', 'processing', 'shipped', 'delivered', 'completed'];
for (let i = 0; i < 26; i++) {
  const age = Math.floor(i * 1.7 + rnd() * 2);
  const person = i < 4 ? people[i % 2] : pick(people);
  const id = 26 - i;
  let status: OrderStatus;
  if (age < 1) status = 'new';
  else if (age < 2) status = 'sent_to_partner';
  else if (age < 3) status = 'processing';
  else if (age < 6) status = 'shipped';
  else if (age < 14) status = 'delivered';
  else status = 'completed';
  if (i === 9) status = 'refused';
  if (i === 15) status = 'cancelled';
  if (i === 4) status = 'processing';
  const lines = [] as { p: Product; q: number }[];
  if (rnd() < 0.55) lines.push({ p: pick(systems), q: 1 });
  lines.push({ p: pick(carts), q: 1 + Math.floor(rnd() * 3) });
  if (rnd() < 0.3) lines.push({ p: pick(carts), q: 2 });
  const created = daysAgo(age, 8 + Math.floor(rnd() * 10));
  const items = lines.map(({ p, q }) => {
    const pct = pctFor(p.id);
    return {
      id: itemId++,
      order_id: id,
      product_id: p.id,
      sku: p.sku,
      name: p.name,
      unit_price: p.sale_price,
      quantity: q,
      line_total: p.sale_price * q,
      commission_pct: pct,
      commission_amount: Math.round(p.sale_price * q * pct) / 100,
    };
  });
  const email = `${person[0].toLowerCase()}.${person[1].toLowerCase().replace(/[čć]/g, 'c').replace('đ', 'dj').replace('š', 's').replace('ž', 'z')}@example.com`;
  const o: Order = {
    id,
    order_number: `VN-2026-${String(id).padStart(4, '0')}`,
    status,
    first_name: person[0],
    last_name: person[1],
    street: pick(streets),
    house_number: String(1 + Math.floor(rnd() * 90)),
    apartment: rnd() < 0.4 ? String(1 + Math.floor(rnd() * 20)) : null,
    city: person[2],
    postal_code: person[3],
    phone: `+381 6${Math.floor(rnd() * 5)} ${100 + Math.floor(rnd() * 899)} ${1000 + Math.floor(rnd() * 8999)}`,
    email,
    customer_note: i === 2 ? 'Molim poziv pre dostave, radim do 16h.' : null,
    internal_note: null,
    items_total: items.reduce((s, x) => s + x.line_total, 0),
    commission_total: items.reduce((s, x) => s + x.commission_amount, 0),
    tracking_code: ['shipped', 'delivered', 'completed'].includes(status) ? `BEX${400000 + id * 37}` : null,
    source: pick(['google', 'facebook', 'direct', 'instagram']),
    delivered_at: ['delivered', 'completed'].includes(status) ? daysAgo(Math.max(0, age - 4)) : null,
    created_at: created,
    updated_at: created,
    items,
  };
  orders.push(o);
  const steps = status === 'refused' ? [...flow.slice(0, 4), 'refused' as OrderStatus] : status === 'cancelled' ? ['new', 'cancelled'] as OrderStatus[] : flow.slice(0, flow.indexOf(status) + 1);
  steps.forEach((s, k) =>
    history.push({ id: histId++, order_id: id, from_status: k ? steps[k - 1] : null, to_status: s, note: null, changed_at: daysAgo(Math.max(0, age - k), 6) }),
  );
  emails.push(
    { id: mailId++, order_id: id, template: 'order_to_partner', recipient: 'daniel.zec@vodanatura.com', subject: `Nova porudžbina ${o.order_number} – VodaNatura`, status: i === 1 ? 'failed' : 'sent', error: i === 1 ? 'SMTP timeout' : null, created_at: created },
    { id: mailId++, order_id: id, template: 'order_confirmation', recipient: 'daniel.zec@vodanatura.com', subject: `Primili smo vašu porudžbinu ${o.order_number}`, status: 'sent', error: null, created_at: created },
  );
}

const imports: StockImportRow[] = [
  {
    id: 2,
    file_name: 'roba spisak 26.09.ods',
    status: 'warnings',
    rows_read: 217,
    rows_matched: 138,
    rows_failed: 2,
    summary: { changed: 14, toOut: 2, backIn: 1, notInFile: ['MATTEO'], failed: [{ code: 'FCC KL', reason: 'prazna količina' }] },
    created_at: daysAgo(9),
    undone_at: null,
  },
  {
    id: 1,
    file_name: 'roba spisak 22.09.ods',
    status: 'success',
    rows_read: 215,
    rows_matched: 137,
    rows_failed: 0,
    summary: { changed: 21, toOut: 1, backIn: 3, notInFile: [], failed: [] },
    created_at: daysAgo(13),
    undone_at: null,
  },
];

const templates: EmailTemplate[] = [
  {
    key: 'order_to_partner',
    name: 'Nova porudžbina (Decor Ambient)',
    recipient: 'partner',
    subject: 'Nova porudžbina {order_number} – VodaNatura',
    body: 'Poštovani,\n\nnova porudžbina sa sajta VodaNatura:\n\nBroj porudžbine: {order_number}\nDatum: {order_date}\n\nIme: {first_name}\nPrezime: {last_name}\nUlica: {street}\nBroj: {house_number}\nStan: {apartment}\nGrad: {city}\nPoštanski broj: {postal_code}\nTelefon: {phone}\nEmail: {email}\n\nProizvodi:\n{items}\n\nUkupno (proizvodi, sa PDV-om): {total}\nPlaćanje: pouzećem\n\nNapomena kupca: {customer_note}\n\nMolimo da status porudžbine javite odgovorom na ovaj email.\n\nVodaNatura',
    is_active: true,
    updated_at: daysAgo(1),
  },
  {
    key: 'order_confirmation',
    name: 'Potvrda porudžbine (kupac)',
    recipient: 'customer',
    subject: 'Primili smo vašu porudžbinu {order_number}',
    body: 'Poštovani/a {first_name},\n\nhvala na porudžbini! Primili smo je i prosledili na pakovanje.\n\nBroj porudžbine: {order_number}\n\n{items}\n\nUkupno za proizvode: {total}\nPlaćanje: pouzećem, kada paket stigne.\nTroškove dostave plaćate kuriru prilikom preuzimanja.\nDostava: {delivery_estimate}.\n\nAdresa dostave:\n{address}\n\nAko imate pitanje, samo odgovorite na ovaj email.\n\nVodaNatura – Filteri vode za vaš dom',
    is_active: true,
    updated_at: daysAgo(1),
  },
];

let bannerId = 3;
let messages: ContactMessage[] = [
  { id: 'm1', created_at: daysAgo(0, 2), name: 'Jelena Petrović', email: 'jelena.p@example.com', phone: '064 123 4567', topic: 'izbor', message: 'Dobar dan, živimo u stanu u Novom Sadu, četvoro nas je. Da li nam je bolja reverzna osmoza ili filter na slavinu? Smeta nam ukus hlora.', page: '/vodic/hlor-u-vodi/', status: 'new' },
  { id: 'm2', created_at: daysAgo(1, 5), name: 'Marko Ilić', email: 'marko.ilic@example.com', phone: null, topic: 'ugradnja', message: 'Imam kuću kod Subotice, bunar. Koliko bi koštala ugradnja sistema za celu kuću? Mogu da pošaljem analizu vode.', page: '/filteri-za-celu-kucu/', status: 'new' },
  { id: 'm3', created_at: daysAgo(3), name: 'Ana Jovanović', email: 'ana.j@example.com', phone: '063 555 222', topic: 'porudzbina', message: 'Poručila sam STO 10 uložak pre 5 dana, kada stiže?', page: '/kontakt/', status: 'forwarded' },
  { id: 'm4', created_at: daysAgo(6), name: 'Petar Nikolić', email: 'petar.n@example.com', phone: null, topic: 'drugo', message: 'Da li prodajete i filtere za akvarijum?', page: '/', status: 'answered' },
];

let banners: Banner[] = [
  { id: 1, placement: 'hero', title: 'Čista voda iz slavine, bez nošenja flaša', body: 'Filteri za vodu za stan i kuću. Plaćate tek kad stigne.', button_label: 'Pronađi pravi filter', button_url: '/izbor-filtera/', image_desktop: 'images/hero/filtrirana-voda-iz-slavine-1680.webp', image_mobile: null, starts_at: null, ends_at: null, is_draft: false, sort_order: 0 },
  { id: 2, placement: 'promo', title: 'Vreme je za nove uloške', body: 'Menjajte uloške na 6 meseci za ukusnu vodu.', button_label: 'Pogledaj uloške', button_url: '/ulosci/', image_desktop: null, image_mobile: null, starts_at: daysAgo(-3), ends_at: daysAgo(-30), is_draft: false, sort_order: 0 },
];

let demoAuth: AuthStep = { step: 'ready', email: 'admin@vodanatura.com' };
const priceHistory: PriceHistoryRow[] = [];
let docs: ProductDocument[] = [];
let docId = 1;

export const demoApi: AdminApi = {
  demo: true,
  auth: {
    async current() {
      return demoAuth;
    },
    async signIn(email) {
      await wait();
      demoAuth = { step: 'ready', email };
      return demoAuth;
    },
    async signOut() {
      demoAuth = { step: 'signed_out' };
    },
    async resetPassword() {
      await wait();
    },
    async updatePassword() {
      await wait();
    },
    async enrollTotp() {
      return { factorId: 'demo', qrSvg: '', secret: 'DEMO-SECRET' };
    },
    async verifyTotp() {
      demoAuth = { step: 'ready', email: 'admin@vodanatura.com' };
      return demoAuth;
    },
    onSignedOut() {
      return () => {};
    },
  },

  async loadCatalog() {
    await wait();
    return structuredClone({ categories, products, rules, settings });
  },
  async updateProduct(id, patch) {
    await wait();
    Object.assign(products.find((p) => p.id === id)!, patch);
  },
  async updateProductInternal(id, patch) {
    await wait();
    Object.assign(products.find((p) => p.id === id)!.internal, patch);
  },
  async setPrices(ids, mode: PriceMode, value, source) {
    await wait();
    for (const id of ids) {
      const p = products.find((x) => x.id === id)!;
      const old = p.sale_price;
      p.price_mode = mode;
      p.price_override = mode === 'auto' ? null : value;
      recalc(p);
      if (old !== p.sale_price) priceHistory.unshift({ id: Date.now() + id, product_id: id, old_price: old, new_price: p.sale_price, source, changed_at: new Date().toISOString() });
    }
    return ids.length;
  },
  async priceHistory(productId) {
    const p = products.find((x) => x.id === productId)!;
    return [
      ...priceHistory.filter((h) => h.product_id === productId),
      { id: -productId, product_id: productId, old_price: null, new_price: p.partner_price, source: 'import', changed_at: daysAgo(1) },
    ];
  },
  async setVisibility(ids, visible) {
    ids.forEach((id) => (products.find((p) => p.id === id)!.is_visible = visible));
  },
  async setCategory(ids, categoryId) {
    ids.forEach((id) => (products.find((p) => p.id === id)!.category_id = categoryId));
  },

  async uploadFile(_folder, file) {
    return URL.createObjectURL(file);
  },
  async addImage(productId, src, alt) {
    const p = products.find((x) => x.id === productId)!;
    const img = { id: imageId++, product_id: productId, src, alt, sort_order: p.images.length, is_primary: !p.images.length };
    p.images.push(img);
    return img;
  },
  async updateImage(id, patch) {
    for (const p of products) {
      const img = p.images.find((i) => i.id === id);
      if (img) Object.assign(img, patch);
    }
  },
  async deleteImage(id) {
    for (const p of products) p.images = p.images.filter((i) => i.id !== id);
  },
  async setPrimaryImage(productId, imageId2) {
    products.find((p) => p.id === productId)!.images.forEach((i) => (i.is_primary = i.id === imageId2));
  },
  async reorderImages(productId, orderedIds) {
    const p = products.find((x) => x.id === productId)!;
    p.images = orderedIds.map((id, i) => ({ ...p.images.find((x) => x.id === id)!, sort_order: i }));
  },
  async listDocuments(productId) {
    return docs.filter((d) => d.product_id === productId);
  },
  async addDocument(productId, title, url) {
    docs.push({ id: docId++, product_id: productId, title, url, sort_order: docs.length });
  },
  async deleteDocument(id) {
    docs = docs.filter((d) => d.id !== id);
  },

  async setCommissionRule(target, pct) {
    await demoApi.setCommissionRules([target], pct);
  },
  async setCommissionRules(targets, pct) {
    await wait();
    for (const t of targets) {
      rules = rules.filter((r) => ('category_id' in t ? r.category_id !== t.category_id : r.product_id !== t.product_id));
      if (pct !== null)
        rules.push({ id: ruleId++, category_id: 'category_id' in t ? t.category_id : null, product_id: 'product_id' in t ? t.product_id : null, pct });
    }
  },
  async listCommissionRules() {
    return structuredClone(rules);
  },
  async listCommissionLines() {
    const earnDays = Number(settings.commission_earn_days ?? 7);
    const lines: CommissionLine[] = [];
    for (const o of orders)
      for (const i of o.items)
        lines.push({
          order_item_id: i.id,
          order_id: o.id,
          order_number: o.order_number,
          ordered_at: o.created_at,
          delivered_at: o.delivered_at,
          order_status: o.status,
          sku: i.sku,
          name: i.name,
          quantity: i.quantity,
          line_total: i.line_total,
          commission_pct: i.commission_pct,
          commission_amount: i.commission_amount,
          commission_status: ['cancelled', 'refused', 'returned'].includes(o.status)
            ? 'cancelled'
            : ['delivered', 'completed'].includes(o.status) && o.delivered_at && Date.parse(o.delivered_at) + earnDays * 86400000 <= Date.now()
              ? 'earned'
              : 'pending',
        });
    return lines;
  },

  async listOrders() {
    await wait();
    return structuredClone(orders);
  },
  async orderActivity(orderId) {
    return { history: history.filter((h) => h.order_id === orderId), emails: emails.filter((e) => e.order_id === orderId) };
  },
  async setOrderStatus(orderId, status, note) {
    await wait();
    const o = orders.find((x) => x.id === orderId)!;
    history.push({ id: histId++, order_id: orderId, from_status: o.status, to_status: status, note: note || null, changed_at: new Date().toISOString() });
    o.status = status;
    if (status === 'delivered' && !o.delivered_at) o.delivered_at = new Date().toISOString();
  },
  async updateOrder(orderId, patch) {
    Object.assign(orders.find((x) => x.id === orderId)!, patch);
  },
  async lastStatusChanges() {
    return [...history].sort((a, b) => b.changed_at.localeCompare(a.changed_at)).map((h) => ({ order_id: h.order_id, changed_at: h.changed_at }));
  },

  async listCustomers() {
    const map = new Map<string, Customer>();
    for (const o of [...orders].sort((a, b) => b.created_at.localeCompare(a.created_at))) {
      if (!o.email) continue;
      const c = map.get(o.email);
      const counted = ['cancelled', 'refused', 'returned'].includes(o.status) ? 0 : o.items_total;
      if (!c)
        map.set(o.email, { email: o.email, name: `${o.first_name} ${o.last_name}`, phone: o.phone, city: o.city, orders_count: 1, total_ordered: counted, last_order_at: o.created_at, first_order_at: o.created_at });
      else {
        c.orders_count++;
        c.total_ordered += counted;
        c.first_order_at = o.created_at;
      }
    }
    return [...map.values()];
  },
  async anonymizeCustomer(email) {
    let n = 0;
    for (const o of orders)
      if (o.email === email) {
        Object.assign(o, { first_name: 'Obrisano', last_name: '', street: '', house_number: '', apartment: null, postal_code: '', phone: '', email: '', customer_note: null });
        n++;
      }
    return n;
  },

  async listStockImports() {
    return structuredClone(imports);
  },
  async applyStockImport(i) {
    await wait(300);
    for (const c of i.changes) {
      const p = products.find((x) => x.id === c.product_id)!;
      p.stock_qty = c.qty;
      p.stock_state = c.qty > 0 ? 'in_stock' : p.made_to_order ? 'made_to_order' : 'out_of_stock';
      p.stock_updated_at = new Date().toISOString();
    }
    const id = Math.max(0, ...imports.map((x) => x.id)) + 1;
    imports.unshift({ id, file_name: i.fileName, status: i.status, rows_read: i.rowsRead, rows_matched: i.rowsMatched, rows_failed: i.rowsFailed, summary: i.summary, created_at: new Date().toISOString(), undone_at: null });
    return id;
  },
  async undoStockImport(id) {
    const imp = imports.find((x) => x.id === id);
    if (imp) {
      imp.status = 'undone';
      imp.undone_at = new Date().toISOString();
    }
  },

  async saveSettings(values) {
    await wait();
    Object.assign(settings, values);
  },

  async listTemplates() {
    return structuredClone(templates);
  },
  async saveTemplate(key, patch) {
    await wait();
    Object.assign(templates.find((t) => t.key === key)!, patch, { updated_at: new Date().toISOString() });
  },
  async listEmailLog() {
    return [...emails].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async listMessages() {
    return [...messages].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async setMessageStatus(ids, status) {
    await wait();
    for (const m of messages) if (ids.includes(m.id)) m.status = status;
  },
  async deleteMessage(id) {
    messages = messages.filter((m) => m.id !== id);
  },

  async listBanners() {
    return structuredClone(banners);
  },
  async saveBanner(b) {
    await wait();
    if (b.id) Object.assign(banners.find((x) => x.id === b.id)!, b);
    else banners.push({ ...b, id: bannerId++ });
  },
  async deleteBanner(id) {
    banners = banners.filter((b) => b.id !== id);
  },

  async republish() {
    await wait(400);
    return { ok: false, reason: 'not_configured' };
  },
};
