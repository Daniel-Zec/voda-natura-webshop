# VodaNatura webshop — notes for Claude

Home water-filter shop for Serbia. Owner: Daniel Zec. Partner Decor Ambient (DA) ships and collects cash on delivery; VodaNatura earns commission. Planning lives in Jira (project VODANATURA, key decisions in VODANATURA-75) and the claude.ai project docs (Admin Panel Guide, SEO Build Guide, Knowledge Base, design tokens).

## Stack
Astro 7 (static) + React 19 components with CSS modules, Storybook 10 for the design system, Supabase project `vodanatura` (ref `cgaoexscwzjgznphhpzw`, eu-central-1) for data/auth/email/cron. Test hosting: GitHub Pages under `/voda-natura-webshop/`.

## Conventions
- Components only use `--vn-*` tokens. `colors.css` and `typography.css` come from the Figma export and are not edited by hand; `layout.css` holds spacing/radius measured from the mock-ups.
- Every reusable component has a story; docs in English, shop copy in Serbian Latin.
- Links and images through `url()` / `routes` (`src/lib/url.ts`) so the base path works.
- Pages must work without JavaScript where possible; interactive parts are islands (`client:visible`).
- The repository is public: never commit secrets. Test admin login details live in Jira, not here.
- Decisions already made (29 Sep 2026): no shipping price or free shipping on the site; commission earned after 7 days by default (admin setting); no invoices — commission summary by date range; price override = manual correction; auto price sync from decorambient.com; Serbian Latin only; B2C house systems first; orders emailed from narudzbine@vodanatura.com.
- Catalogue: Supabase → `scripts/fetch-catalog.mjs` (prebuild) → `src/data/catalog.json` → pages via `src/lib/catalog.ts`. The sandbox can't reach Supabase, so local builds use the committed snapshot; use the Supabase MCP tools for database work and commit migrations to `supabase/migrations/`.
- Internal data (partner texts, data notes, commission rules) lives in admin-only tables (`product_internal`, `commission_rules`); never add it to public tables.
- Run `npx astro check` and `npm run build` before committing.
- Admin panel: `src/admin/` (React app on `/admin/`, hash routes). Data only through `src/admin/lib/api.ts`; screenshots/tests use `PUBLIC_ADMIN_DEMO=true` (demoApi), which must never reach the live build. Admin RLS requires `admin_users` + `aal2` (two-step login). See `docs/admin-panel.md`.
- Run `npm run test:stock` after touching the stock import.
