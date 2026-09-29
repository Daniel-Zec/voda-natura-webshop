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
- Run `npx astro check` and `npm run build` before committing.
