# VodaNatura webshop

Webshop for home water filters in Serbia. Decor Ambient d.o.o. (Subotica) packs, ships and collects cash on delivery; VodaNatura earns a commission per sale.

**Test site:** https://daniel-zec.github.io/voda-natura-webshop/ (hidden from search engines)
**Design system:** https://daniel-zec.github.io/voda-natura-webshop/storybook/

## Stack

| Part | Tool | Why |
| --- | --- | --- |
| Pages | [Astro](https://astro.build) (static output) | Finished HTML for SEO and speed (SEO Build Guide) |
| Components | React + CSS modules | Every reusable part is a React component, documented in Storybook |
| Design tokens | CSS variables from Figma "VodaNatura — Design System" | One source for colours and type |
| Design system docs | [Storybook](https://storybook.js.org) | Living catalogue of all components and tokens |
| Data, login, email, jobs | [Supabase](https://supabase.com) project `vodanatura` (EU Frankfurt) | Catalogue live; orders, login and email next |
| Hosting (test) | GitHub Pages via GitHub Actions | Free; final host decided later |

## Run it locally

```bash
npm install
npm run dev              # shop on http://localhost:4321/voda-natura-webshop/
npm run storybook        # design system on http://localhost:6006
npm run build            # production build into dist/
npx astro check          # type check
```

Every push to `main` builds and publishes both the shop and Storybook (`.github/workflows/deploy.yml`).

## Folder map

```
src/
  styles/tokens/        colors.css, typography.css (from Figma — never edit by hand), layout.css
  styles/global.css     font, reset, base elements
  components/ui/        basic parts: Button, Badge, Price, SearchBar, QuantityStepper…
  components/shop/      shop parts: ProductCard, SavingsCalculator, FaqList, Hero…
  components/layout/    AnnouncementBar, SiteHeader, SiteFooter
  config/site.ts        phone, email, partner, delivery texts — placeholders in [BRACKETS]
  config/navigation.ts  menus
  data/                 homepage content (temporary, moves to Supabase)
  lib/                  price formatting, links that work with the base path
  scripts/cart.ts       add-to-cart and compare on static pages
  pages/                one file per URL (pages/admin/ = admin panel)
  admin/                admin panel app: screens/, components/, lib/ (data layer, stock import)
  stories/              Storybook intro and Foundations pages
design-tokens/          full token JSON from Figma
docs/                   decisions and notes
```

## How the catalogue reaches the site

1. Products, prices, stock and categories live in Supabase (`supabase/migrations/` holds the structure).
2. Before every build, `scripts/fetch-catalog.mjs` reads the visible catalogue with the public key and writes `src/data/catalog.json`; partner photos are copied to `/images/partner/`.
3. Astro builds one page per category (`/{slug}/`) and product (`/proizvod/{slug}/`) from that file.
4. If Supabase can't be reached, the last committed `catalog.json` is used, so the site still builds.

A change in Supabase shows on the site after the next build (any push, **Actions → Deploy to GitHub Pages → Run workflow**, or the **Objavi** button in the admin panel once its GitHub token is set).

## Admin panel

`/admin/` (test: https://daniel-zec.github.io/voda-natura-webshop/admin/): orders, customers, products, stock import, prices, commission, marketing, emails, settings. Login with password + authenticator code. Details and one-time setup: `docs/admin-panel.md`.

```bash
PUBLIC_ADMIN_DEMO=true npm run dev   # admin with sample data, no login (never deploy this)
npm run test:stock                   # stock import tests
```

First import from the Decor Ambient feed: `docs/catalog-import.md`.

## Rules

- Use tokens (`--vn-color-*`, `--vn-text-*`, `--vn-space-*`, `--vn-radius-*`), never hex codes in components.
- Each new reusable component gets a `*.stories.tsx` next to it.
- Internal links and images go through `url()` / `routes` in `src/lib/url.ts`.
- Shop text is Serbian Latin; product texts are function only, no health claims.
- No passwords, API keys or secrets in the repository (it is public). Use GitHub/Supabase secrets.

## Moving to the real domain

Set `SITE_URL=https://vodanatura.com`, `BASE_PATH=/` and `PUBLIC_NOINDEX=false`, and replace `public/robots.txt` (see the SEO Build Guide).
