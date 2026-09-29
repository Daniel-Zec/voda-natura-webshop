#!/usr/bin/env python3
"""
Turns Decor Ambient's WooCommerce product feed (product-data/da/p1.json + p2.json)
into SQL for the VodaNatura catalogue: categories (SEO structure), products,
images and internal notes.

    python3 scripts/import_da_catalog.py path/to/da > supabase/seed/catalog.sql

Rules (see docs/catalog-import.md):
- Grouped "family" pages (PS, PP, EL, PS-L, PS 20BB) are not products: skipped.
- Duplicate listings are imported hidden, with a note.
- Missing or placeholder SKUs get a code from the product name, with a note.
- Stock: "N na zalihama" -> in stock (N); "Nema na zalihama" -> out of stock;
  pre-order / backorder -> made to order.
- Partner long texts are not copied (duplicate content + unproven claims; they stay
  on decorambient.com via partner_url and are fetched by the price sync later);
  their "Label: value" lines become the public specs table.
- RO 1000 (industrial) is hidden: launch focus is B2C house systems.
"""
import html
import json
import re
import sys
import unicodedata
from html.parser import HTMLParser
from pathlib import Path

src = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
products = json.loads((src / 'p1.json').read_text()) + json.loads((src / 'p2.json').read_text())

# ---------------------------------------------------------------- categories
# (slug, name, parent, sort, show_in_menu, description)
CATEGORIES = [
    ('sistemi', 'Sistemi za vodu', None, 1, True, 'Kompletni sistemi za prečišćavanje vode za stan i kuću.'),
    ('filteri-za-pijacu-vodu', 'Voda za piće', 'sistemi', 1, True, 'Reverzna osmoza, kuhinjski filteri i vodomati.'),
    ('reverzna-osmoza', 'Reverzna osmoza', 'filteri-za-pijacu-vodu', 1, True, 'Sistemi reverzne osmoze ispod sudopere.'),
    ('filteri-za-celu-kucu', 'Cela kuća', 'sistemi', 2, True, 'Pesak, rđa i hlor na ulazu vode u kuću.'),
    ('omeksivaci-vode', 'Omekšivači', 'sistemi', 3, True, 'Protiv kamenca u tvrdoj vodi.'),
    ('tus-i-kucni-aparati', 'Tuš i aparati', 'sistemi', 4, True, 'Filteri za tuš, veš i sudo mašinu.'),
    ('ulosci-i-delovi', 'Ulošci i delovi', None, 2, True, 'Zamenski ulošci, kućišta i rezervni delovi.'),
    ('ulosci', 'Ulošci', 'ulosci-i-delovi', 1, True, 'Zamena na 6 meseci, sve veličine.'),
    ('sedimentni-ulosci', 'Sedimentni ulošci', 'ulosci', 1, True, 'Pesak, rđa i sitne čestice.'),
    ('ugljeni-ulosci', 'Ulošci od aktivnog uglja', 'ulosci', 2, True, 'Hlor, ukus i miris vode.'),
    ('ulosci-za-gvozdje-i-kamenac', 'Gvožđe i kamenac', 'ulosci', 3, True, 'Uklanjanje gvožđa i omekšavanje vode.'),
    ('ulosci-za-reverznu-osmozu', 'Ulošci i membrane za reverznu osmozu', 'ulosci', 4, True, 'In-line ulošci i RO membrane.'),
    ('ulosci-za-tus', 'Ulošci za filter za tuš', 'ulosci', 5, True, 'Zamenski ulošci za filtere za tuš.'),
    ('kucista', 'Kućišta', 'ulosci-i-delovi', 2, True, 'Kućišta za uloške od 10″, 20″ i Big Blue.'),
    ('rezervni-delovi', 'Rezervni delovi', 'ulosci-i-delovi', 3, False, 'Slavine, rezervoari, ventili, spojnice i cevi.'),
]

def classify(p):
    sku = (p['sku'] or '').upper()
    name = html.unescape(p['name']).upper()
    cats = [c['name'] for c in p['categories']]
    if sku in ('RO6', 'RO6-MP', 'RO1000'):
        return 'reverzna-osmoza'
    if sku in ('FSCNT', 'CW929'):
        return 'filteri-za-pijacu-vodu'
    if sku in ('MATTEO', 'WF PRE 34'):
        return 'filteri-za-celu-kucu'
    if 'Omekšivači' in cats:
        return 'omeksivaci-vode'
    if sku in ('WFSH-S', 'WFSH-LEMON', 'WFSH-LEMON-1', 'WFST', 'WFST-1'):
        return 'tus-i-kucni-aparati'
    if sku == 'FCWFSH-S':
        return 'ulosci-za-tus'
    if sku.startswith(('TLC', 'L-')):
        return 'ulosci-za-reverznu-osmozu'
    if sku.startswith(('IR-', 'ST-')):
        return 'ulosci-za-gvozdje-i-kamenac'
    if sku.startswith(('BL-', 'STO')):
        return 'ugljeni-ulosci'
    if 'Ulošci' in cats:
        return 'sedimentni-ulosci'
    if not cats or 'KUĆIŠTE' in name and not sku.startswith('YT'):
        return 'kucista'
    return 'rezervni-delovi'

# ---------------------------------------------------------------- helpers
def slugify(text):
    text = text.lower().replace('đ', 'dj')
    text = unicodedata.normalize('NFD', text)
    text = ''.join(ch for ch in text if unicodedata.category(ch) != 'Mn')
    text = re.sub(r'[″"”]', '', text)
    text = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    return text

class TextLines(HTMLParser):
    def __init__(self):
        super().__init__()
        self.lines, self.buf = [], ''
    def handle_starttag(self, tag, attrs):
        if tag in ('br', 'p', 'li', 'tr', 'div', 'h2', 'h3', 'h4'):
            self.flush()
    def handle_endtag(self, tag):
        if tag in ('p', 'li', 'tr', 'div', 'h2', 'h3', 'h4'):
            self.flush()
    def handle_data(self, data):
        self.buf += data
    def flush(self):
        t = re.sub(r'\s+', ' ', self.buf).strip()
        if t:
            self.lines.append(t)
        self.buf = ''

def lines_of(fragment):
    parser = TextLines()
    parser.feed(html.unescape(fragment or ''))
    parser.flush()
    return parser.lines

def specs_from(description):
    specs = []
    for line in lines_of(description):
        m = re.match(r'^([^:]{2,60}):\s*(.{1,160})$', line)
        if m and not m.group(1).lower().startswith(('http', 'napomena')):
            label = m.group(1).strip().replace('Dinemzije', 'Dimenzije')
            specs.append({'label': label, 'value': m.group(2).strip()})
    return specs[:20]

def clean_name(raw):
    n = html.unescape(raw).replace('&#8211;', '–')
    n = re.sub(r'\s+', ' ', n).strip()
    return n

def stock_of(p):
    text = (p['stock_availability'] or {}).get('text', '') or ''
    cls = (p['stock_availability'] or {}).get('class', '')
    m = re.match(r'(\d+)\s+na zalihama', text)
    if m:
        return 'in_stock', int(m.group(1))
    if 'Nema' in text or cls == 'out-of-stock':
        return 'out_of_stock', 0
    if 'avans' in text.lower() or 'backorder' in cls or p.get('is_on_backorder'):
        return 'made_to_order', None
    return 'in_stock', None

def q(v):
    if v is None:
        return 'null'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, (dict, list)):
        return "'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "'::jsonb"
    return "'" + str(v).replace("'", "''") + "'"

# ---------------------------------------------------------------- curated overrides
# Homepage products: texts from the mock-up, images from the mock-up (local WebP).
CURATED = {
    'RO6': dict(slug='ro-6-wfu-reverzna-osmoza', kicker='Ispod sudopere · 6 stepeni',
                summary='Do 284 l vode za piće dnevno. Uklanja do 98% rastvorenih materija.',
                maintenance='Membrana na 3 godine, oko 2.170 RSD godišnje', badge=('Najbolje za piće', 'info'),
                local='images/products/ro-6-wfu-reverzna-osmoza.webp', featured=1),
    'FSCNT': dict(slug='fscnt-kuhinjski-filter', kicker='Na slavinu · bez bušenja',
                  summary='Uklanja pesak, hlor i organska jedinjenja. Bolji ukus i miris vode.',
                  maintenance='2.438 RSD godišnje (STO 10)', badge=('Najpovoljniji start', 'natura'),
                  local='images/products/fscnt-kuhinjski-filter.webp', featured=2),
    'WS-20': dict(slug='ws-20-primo-omeksivac-vode', kicker='Cela kuća · automatska regeneracija',
                  summary='Štiti bojler, mašine i slavine od kamenca. Protok 1,2 m³/h.',
                  maintenance='so, 3–4,5 kg po regeneraciji', badge=('Za kuće', 'sand'),
                  local='images/products/ws-20-primo-omeksivac-vode.webp', featured=3),
    'WFSH-S': dict(slug='wfsh-s-filter-za-tus', kicker='Tuš · nije za piće',
                   summary='Manje kamenca na tušu i manje hlora koji isušuje kožu.',
                   maintenance='2.210 RSD godišnje', local='images/products/wfsh-s-filter-za-tus.webp', featured=4),
    'BL-10': dict(slug='bl-10-ugljeni-blok-ulozak', kicker='Ugljeni blok · hlor, ukus',
                  local='images/products/bl-10-ugljeni-blok-ulozak.webp'),
    'STO-10': dict(slug='sto-10-ulozak', kicker='Za FSCNT · 2 stepena', local='images/products/sto-10-ulozak.webp'),
    'WFST': dict(slug='wfst-filter-za-ves-masinu', kicker='Veš i sudo mašina',
                 local='images/products/wfst-filter-za-ves-masinu.webp'),
    'TLC75': dict(slug='tlc-75-membrana'),
    'RO6-MP': dict(kicker='Ispod sudopere · sa pumpom za nizak pritisak'),
    'DW8': dict(kicker='Cela kuća · automatska regeneracija'),
    'CW929': dict(kicker='Samostojeći · topla, hladna i sobna voda'),
    'MATTEO': dict(kicker='Cela kuća · 4 stepena · UV lampa'),
    # Unproven health claims in the partner text (content rules, 23 Sep): neutral summary only.
    'L-YOUNG-Q': dict(summary='In-line uložak koji dodaje minerale i podiže pH vode posle reverzne osmoze. Menja se na 12 meseci.'),
    'L-BIO-Q': dict(summary='In-line biokeramički uložak za sisteme reverzne osmoze. Menja se na 6 meseci.'),
}
GROUPED_SKIPPED = []
DUPLICATES = {  # hidden older listing -> kept listing
    2880: 8446, 2878: 8445, 2876: 8442, 2859: 8425,
}
SKU_FIXES = {  # partner id -> (sku, note)
    8592: ('BR1P', 'Nema šifre u feedu partnera; šifra uzeta iz naziva.'),
    8556: ('BR-BB', 'Nema šifre u feedu partnera; šifra uzeta iz naziva.'),
    8425: ('PP-20M-20BB', 'Nema šifre u feedu partnera; šifra uzeta iz naziva.'),
    8435: ('WFW34EMI-SET', 'Nema šifre u feedu partnera; šifra uzeta iz naziva.'),
    2005: ('WFU10', 'U feedu partnera piše "Uneti pravu šifru" — potvrditi pravu šifru (VODANATURA-34).'),
    2859: ('PP-20M-20BB-OLD', None),
}
HIDDEN = {
    8382: 'Industrijski sistem (RO 1000) — van ponude za početak (B2C, VODANATURA-75 p.19).',
}

rows, image_rows, internal_rows = [], [], []
used_slugs, used_skus = set(), set()
summary = {'imported': 0, 'hidden': 0, 'skipped_grouped': [], 'notes': []}
for p in products:
    if p['type'] == 'grouped':
        summary['skipped_grouped'].append(f"{p['sku']} – {clean_name(p['name'])}")
        continue
    pid = p['id']
    name = clean_name(p['name'])
    sku = (p['sku'] or '').strip()
    notes = []
    if pid in SKU_FIXES:
        sku, note = SKU_FIXES[pid]
        if note:
            notes.append(note)
    cur = CURATED.get(sku, {})
    category = classify({**p, 'sku': sku})
    stock_state, stock_qty = stock_of(p)
    visible = True
    if pid in DUPLICATES:
        visible = False
        notes.append(f'Duplikat proizvoda (partner id {DUPLICATES[pid]}); sakriven.')
    if pid in HIDDEN:
        visible = False
        notes.append(HIDDEN[pid])
    if not p['images']:
        notes.append('Nema fotografije.')
    slug = cur.get('slug') or slugify(name)[:70].strip('-')
    base, n = slug, 2
    while slug in used_slugs:
        slug = f'{base}-{n}'; n += 1
    used_slugs.add(slug)
    assert sku not in used_skus, sku
    used_skus.add(sku)

    short = ' '.join(lines_of(p['short_description']))
    dims = {k: float(v) for k, v in (p.get('dimensions') or {}).items() if v} or None
    badge = cur.get('badge')
    row = {
        'sku': sku, 'slug': slug, 'name': name, 'cat': category,
        'kicker': cur.get('kicker'), 'summary': cur.get('summary') or (short[:240] if short else None),
        'specs': specs_from(p['description']), 'maint': cur.get('maintenance'),
        'bl': badge[0] if badge else None, 'bt': badge[1] if badge else None,
        'price': int(p['prices']['price'] or 0), 'stock': stock_state, 'qty': stock_qty,
        'vis': visible, 'feat': bool(cur.get('featured')), 'sort': cur.get('featured', 100),
        'pid': pid, 'url': p['permalink'],
        'w': float(p['weight']) if p.get('weight') else None, 'dims': dims,
    }
    rows.append({k: v for k, v in row.items() if v not in (None, [], False)})
    internal_rows.append({'sku': sku, 'name': name, 'notes': ' '.join(notes) or None})
    images = [(cur['local'], name)] if cur.get('local') else []
    images += [(img['src'], html.unescape(img.get('alt') or '') or name) for img in p['images']]
    for i, (isrc, alt) in enumerate(images):
        image_rows.append({'sku': sku, 'src': isrc, 'alt': alt if alt != name else None, 'i': i})
    summary['imported'] += 1
    if not visible:
        summary['hidden'] += 1
    if notes:
        summary['notes'].append(f'{sku}: {" ".join(notes)}')

def j(v):
    return "'" + json.dumps(v, ensure_ascii=False, separators=(',', ':')).replace("'", "''") + "'::jsonb"

out = ['-- Generated by scripts/import_da_catalog.py from the Decor Ambient product feed. Do not edit by hand.', '-- Runs as one statement batch (see docs/catalog-import.md).']
for slug, name, parent, sort, menu, desc in CATEGORIES:
    parent_sql = f"(select id from public.categories where slug = {q(parent)})" if parent else 'null'
    out.append(
        f"insert into public.categories (slug, name, parent_id, sort_order, show_in_menu, description) values "
        f"({q(slug)}, {q(name)}, {parent_sql}, {sort}, {q(menu)}, {q(desc)});"
    )
out.append(f"""insert into public.products (sku, slug, name, category_id, kicker, summary, specs, maintenance, badge_label, badge_tone,
  partner_price, stock_state, stock_qty, stock_updated_at, is_visible, is_featured, sort_order, partner_product_id, partner_url, weight_kg, dimensions_cm)
select r.sku, r.slug, r.name, c.id, r.kicker, r.summary, coalesce(r.specs, '[]'), r.maint, r.bl, r.bt,
  r.price, r.stock::public.stock_state, r.qty, '2026-09-23T00:00:00Z', coalesce(r.vis, false), coalesce(r.feat, false), r.sort, r.pid, r.url, r.w, r.dims
from jsonb_to_recordset({j(rows)}) as r(sku text, slug text, name text, cat text, kicker text, summary text, specs jsonb, maint text,
  bl text, bt text, price int, stock text, qty int, vis boolean, feat boolean, sort int, pid int, url text, w numeric, dims jsonb)
join public.categories c on c.slug = r.cat;""")
out.append(f"""insert into public.product_internal (product_id, partner_name, data_notes)
select p.id, r.name, r.notes from jsonb_to_recordset({j(internal_rows)}) as r(sku text, name text, notes text)
join public.products p on p.sku = r.sku;""")
out.append(f"""insert into public.product_images (product_id, src, alt, sort_order, is_primary)
select p.id, r.src, coalesce(r.alt, p.name), r.i, r.i = 0 from jsonb_to_recordset({j(image_rows)}) as r(sku text, src text, alt text, i int)
join public.products p on p.sku = r.sku;""")

print('\n'.join(out))
print(json.dumps(summary, ensure_ascii=False, indent=2), file=sys.stderr)

# ---------------------------------------------------------------- snapshot (same shape as scripts/fetch-catalog.mjs)
if '--snapshot' in sys.argv:
    target = Path(sys.argv[sys.argv.index('--snapshot') + 1])
    by_sku_images = {}
    for im in image_rows:
        by_sku_images.setdefault(im['sku'], []).append({'src': im['src'], 'alt': im['alt'] or next(r['name'] for r in rows if r['sku'] == im['sku'])})
    snapshot = {
        'generatedAt': '2026-09-29T14:10:00Z',
        'source': 'import-script',
        'settings': {
            'shop_phone': '[TELEFON]', 'shop_hours': 'Radnim danima [RADNO VREME]', 'delivery_estimate': 'oko 4 radna dana',
            'installation_phone': '[TELEFON DECOR AMBIENT]', 'installation_price': '[CENA UGRADNJE]',
        },
        'categories': [
            {'slug': slug, 'name': name, 'parentSlug': parent, 'sort': sort, 'showInMenu': menu, 'description': desc,
             'intro': None, 'seoTitle': None, 'seoDescription': None}
            for slug, name, parent, sort, menu, desc in CATEGORIES
        ],
        'products': sorted([
            {'sku': r['sku'], 'slug': r['slug'], 'name': r['name'], 'categorySlug': r['cat'], 'kicker': r.get('kicker'),
             'summary': r.get('summary'), 'descriptionHtml': None, 'specs': r.get('specs', []), 'maintenance': r.get('maint'),
             'badge': {'label': r['bl'], 'tone': r['bt']} if r.get('bl') else None, 'price': r['price'], 'stock': r['stock'],
             'stockQty': r.get('qty'), 'featured': r.get('feat', False), 'sort': r.get('sort', 100), 'partnerUrl': r.get('url'),
             'seoTitle': None, 'seoDescription': None, 'images': by_sku_images.get(r['sku'], [])}
            for r in rows if r.get('vis')
        ], key=lambda p: (p['sort'], p['name'])),
    }
    target.write_text(json.dumps(snapshot, ensure_ascii=False, indent=1) + '\n')
    print(f'snapshot: {len(snapshot["products"])} products -> {target}', file=sys.stderr)
