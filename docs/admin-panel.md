# Admin panel

Built 30 Sep 2026 from the *Admin Panel Guide* (claude.ai project). Address: **`/admin/`** on the shop
(test site: https://daniel-zec.github.io/voda-natura-webshop/admin/). Not linked from the shop, never indexed.
UI language: Serbian Latin; admin body text 14 px; only `--vn-*` tokens.

## How it works

- One static Astro page (`src/pages/admin/index.astro`) that mounts a React app (`src/admin/AdminApp.tsx`, `client:only`).
  Screens use hash routes (`#/porudzbine/12`), so it runs on GitHub Pages or any static host.
- All data goes through `src/admin/lib/api.ts`. `supabaseApi.ts` talks to Supabase with the public key;
  **row-level security is the real protection**: every admin table requires `private.is_admin()`, which now needs
  a row in `admin_users` **and** a session that passed the second login step (`aal2`).
- `demoApi.ts` holds invented orders and customers for screenshots and browser tests. It is only bundled when the
  build runs with `PUBLIC_ADMIN_DEMO=true` (never on the live site; the build is checked for it).

## Screens

| Route | Screen |
| --- | --- |
| `#/` | Dashboard: period picker with comparison, 6 key numbers (visitors wait for the analytics tool), orders per day, top 5/10 products by units, "Treba pažnje" list |
| `#/porudzbine`, `#/porudzbine/:id` | Orders: search, status/date filters, DA email status, CSV; detail with items and commission at order time, allowed status changes with a note, tracking code, internal note, email log |
| `#/kupci`, `#/kupci/:email` | Customers built from orders (view `admin_customers`), CSV, data export and erase of personal data (`admin_anonymize_customer`) |
| `#/poruke` (+ `/new`, `/answered`, `/forwarded`, `/spam`) | Messages from the contact form on `/kontakt/` (table `contact_messages`): search, status tabs, unread count in the menu; a message opens with Odgovori (mail app, pre-filled), Prosledi (forward, e.g. to DA), call, Spam, delete. Nothing is emailed: messages are read here |
| `#/proizvodi` | Product table with filters, bulk: commission %, price correction, reset to Auto, show/hide, category |
| `#/proizvodi/galerija` | Image grid; marks products with no photo or only one |
| `#/proizvodi/zalihe` | Stock import from DA's file: preview, failed rows, apply, history, undo of the last import |
| `#/proizvodi/cene` | Price sync status, corrections (fixed / percent), bulk with preview, reset to Auto |
| `#/provizija`, `#/provizija/stope` | Commission summary (earned / pending / cancelled, by line, product or category, CSV) and rates (default → category → product) |
| `#/marketing` | Hero, promo banners, announcement bar with schedule and desktop/mobile preview |
| `#/emailovi` (+ `/dnevnik`, `/podesavanja`) | Templates with variables and live preview, sending log, email settings with test mode |
| `#/podesavanja` | Shop details, social links (Instagram, Facebook → footer icons and JSON-LD `sameAs`; empty = dimmed icon), commission earn days, dashboard thresholds, idle logout, publishing |

The **product pop-up** (`ProductModal.tsx`) is the only place a product is edited; it opens from the table,
gallery, dashboard and order detail. Tabs: description + specs, images + PDFs, stock (made-to-order flag and DA
codes), price + commission + price history, SEO, internal notes.

## Stock import

`src/admin/lib/stockImport.ts` (tests: `npm run test:stock`).

- Reads `.ods`, `.xlsx`, `.xls`, `.csv`; finds the header row with "Šifra artikla".
- Quantity = **Slobodna količina** (reserved already subtracted); if empty, *Količina − Rezervisano*.
- DA codes are normalised: supplier suffixes `KL`, `DW`, `USTM`, `KOM`, `AQV`, `U` are removed and only A–Z/0–9 kept,
  so `BL 20BB  DW`, `BL 20BB  KL` and `BL-20BB` are one product and are **added up**.
- A product matches by its saved DA codes (`product_internal.stock_codes`, editable in the pop-up) or else its SKU.
  14 codes were saved on 30 Sep (see `supabase/seed/stock_codes.sql`); TLC75 → `TLC75ECO` still needs DA to confirm.
- 0 = out of stock, unless the product is marked made-to-order (`products.made_to_order`) → "Po porudžbini".
- Applied atomically by `admin_apply_stock_import`; `admin_undo_stock_import` restores the previous stock (latest import only).
- The first real sample (30 Sep) had **no quantities at all**; the import refuses such a file with a clear message.

## One-time setup (Daniel)

1. **Admin account:** Supabase → Authentication → Users → *Add user* → `admin@vodanatura.com` with a strong password
   (store it in Jira, not here). Then add the user to `admin_users` (Claude can do it, or SQL:
   `insert into admin_users (user_id, email) select id, email from auth.users where email = 'admin@vodanatura.com';`).
2. **Turn off public sign-ups:** Supabase → Authentication → Sign In / Providers → disable "Allow new users to sign up".
3. First login asks to set up the authenticator app (QR code). After that every login needs the 6-digit code.
4. **Auth redirect:** Supabase → Authentication → URL Configuration → add the admin address to redirect URLs
   (for password reset links).
5. **Contact form table:** run `supabase/migrations/20261001120000_contact_messages.sql` once (Supabase → SQL Editor → paste → Run) if Claude could not apply it. Until then the form on `/kontakt/` shows an error with the phone number, and Poruke shows a notice.
6. **Publishing button:** Supabase → Edge Functions → Secrets → `GITHUB_TOKEN` = fine-grained GitHub token for this
   repository with *Actions: read and write*. The `republish` function starts the deploy workflow.

## Not built yet (and why)

- Sending emails, "Send test", "Resend": waiting for the email service choice (VODANATURA-62).
- Daily price sync from decorambient.com (VODANATURA-71): the screen shows its status once it runs.
- Visitors on the dashboard: waiting for the analytics tool (VODANATURA-63).
- Banners are stored but the shop homepage does not read them yet.
- Phase 2: reading DA's emails (stock files on zalihe@, status replies on narudzbine@), filter-change reminders.
- Figma mock-ups: the Figma Starter plan's monthly MCP limit was used up; screenshots of the built screens serve as mock-ups for now.
