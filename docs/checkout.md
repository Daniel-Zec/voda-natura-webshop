# Cart and checkout

Built 2 Oct 2026. Pages: `/korpa/` (cart), `/porudzbina/` (checkout), `/porudzbina/hvala/` (thank you). All three are noindex.

## How an order flows

1. **Add to cart.** Any `data-add-to-cart` button adds one unit (`src/scripts/cart.ts`). The cart lives in the visitor's browser (`src/lib/cartStore.ts`, key `vn-cart-v1`). Out-of-stock products have a disabled button.
2. **Cart page** (`CartPage`). It checks each line against the catalogue from the last publish, which gives the current price and stock. Changed prices are updated and the visitor sees a notice. Out-of-stock or removed products must be taken out before ordering. Made-to-order products stay in the same order, with a note that Decor Ambient will call.
3. **Checkout** (`CheckoutForm`). Guest checkout in DA's format: Ime, Prezime, Ulica, Broj, Stan, Poštanski broj, Mesto, Telefon, Email, plus a note and consent to the terms and privacy policy. It also has a bot trap, a minimum fill time and a random `client_token`, so a double click creates only one order.
4. **Edge Function `create-order`** (`supabase/functions/create-order`, deployed with `verify_jwt = false`). It validates the form and normalises the phone to `+381…`. Then it calls `place_order(jsonb)`, a security definer function that only `service_role` may execute:
   - re-prices every line from `products.sale_price`
   - rejects hidden or out-of-stock SKUs with `409 unavailable`
   - stores `commission_pct_for()` per line
   - allows at most 3 orders per phone number in 10 minutes
   - saves the order and returns the order number
5. **Emails** are sent in the background after the customer gets the answer:
   - the order to DA (`partner_order_email`)
   - the confirmation to the customer
   - a copy to Daniel (`admin_notify_email`)

   Templates come from `email_templates` (plain text, editable in the admin panel). Each email goes out as HTML (`email-html.ts`: branded header, bold labels, product table, highlighted total) with the plain text as a fallback. Every email is written to `email_log`. **Test mode** (`email_test_mode = true`) sends everything to Daniel, with the real recipient in the subject. When the DA email is sent outside test mode, the order moves to `sent_to_partner`.
6. **Thank-you page.** It shows the order number from `?broj=`, plus the email address and the made-to-order note from `sessionStorage`.

Shipping is not in the order total. Customers pay it to the courier, and every page says so.

## Sending email (setup still needed)

Gmail SMTP on port 465. Supabase blocks ports 25 and 587. In Supabase → Edge Functions → Secrets:

- `GMAIL_SMTP_USER` = `daniel.zec@vodanatura.com`
- `GMAIL_SMTP_PASSWORD` = a Google app password (myaccount.google.com/apppasswords; needs 2-step verification)

In Gmail, add `narudzbine@vodanatura.com` under "Send mail as". Until the secrets exist, orders are saved and emails are logged as `queued`.

Before going live:

- Set DA's order address under Emailovi → Podešavanja.
- Place a test order.
- Turn off test mode.

## Permissions

`service_role` gets only `select` on `settings` and `email_templates` and `insert` on `email_log`. Orders are created only through `place_order()` and marked as sent only through `mark_order_sent_to_partner()`, both security definer functions.
