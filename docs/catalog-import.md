# Catalogue import (Decor Ambient → Supabase)

First import: 29 Sep 2026, from the partner's WooCommerce feed saved on 23 Sep (`product-data/da/p1.json`, `p2.json` in Daniel's project folder).

```bash
python3 scripts/import_da_catalog.py "<folder>/product-data/da" > supabase/seed/catalog.sql
```

The SQL is loaded into Supabase from this repository (Supabase `http` extension reads the raw file from GitHub), so the data never has to be pasted by hand.

## Result

| | Count |
| --- | --- |
| Products imported | 121 |
| Visible in the shop | 116 |
| Hidden | 5 — 4 duplicate listings, RO 1000 (industrial, B2C focus first) |
| Skipped "family" pages | 5 — PS, PP, EL, PS-L, PS 20BB (grouping pages, not products; e.g. "PS 0 RSD") |
| Categories | 15, following the SEO Build Guide |

## Data problems (stored per product in `product_internal.data_notes`, visible in the admin panel)

- BR1P, BR BB, PP 20M-20BB, WFW 34 EMI SET: no SKU in the feed — code taken from the name.
- WFU 10: SKU reads "Uneti pravu šifru" — imported as `WFU10`, real code to confirm (VODANATURA-34).
- PS 1M-L: no photo.
- Duplicates hidden: PS20M20BB, PS5M20BB, PS1M20BB, PP 20M 20BB (older listing) — the newer listings with stock counts are kept.

## Content rules applied

- Partner long descriptions are **not copied** (duplicate content for SEO, and some contain unproven claims). The factual "Label: value" lines are turned into the specs table on the product page. The original stays on decorambient.com (`partner_url`).
- Short descriptions are used as the card summary for now, marked `content_status = partner_copy` so they can be rewritten.
- L YOUNG Q and L BIO Q get a neutral summary (the partner text has health claims).
- Homepage products keep the texts and photos from the mock-up.

## Stock

`N na zalihama` → in stock (N) · `Nema na zalihama` → out of stock · pre-order / backorder → made to order (CW 929, Matteo, ST 20BB). Stock date set to 23 Sep 2026 (feed date). From now on stock changes only through the DA Excel import in the admin panel.
