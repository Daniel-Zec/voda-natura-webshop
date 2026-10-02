// Checkout: turns the cart into an order and sends the order emails.
//
// Called by the checkout page (/porudzbina/) without login. It checks the form, lets the
// database function `place_order` re-price the cart and save the order (prices and commission
// never come from the browser), answers the customer right away, and sends the emails in the
// background:
//   1. order to Decor Ambient   (settings.partner_order_email, template order_to_partner)
//   2. confirmation to customer (template order_confirmation)
//   3. copy to Daniel           (settings.admin_notify_email)
// Test mode (settings.email_test_mode = true) sends every email to admin_notify_email only.
// Every email is written to email_log; once the DA email is sent (not in test mode) the order
// moves to `sent_to_partner`.
//
// Sending goes through Google Workspace SMTP on port 465 (Supabase blocks 25 and 587).
// Setup (once): Supabase → Edge Functions → Secrets:
//   GMAIL_SMTP_USER     = daniel.zec@vodanatura.com   (the Google account that signs in)
//   GMAIL_SMTP_PASSWORD = 16-character Google app password (myaccount.google.com/apppasswords)
// In Gmail, narudzbine@vodanatura.com must be added under "Send mail as", otherwise Google
// rewrites the sender. Without the secrets, orders are still saved and emails are logged as
// "queued" so nothing is lost.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
type Field = 'first_name' | 'last_name' | 'street' | 'house_number' | 'apartment' | 'city' | 'postal_code' | 'phone' | 'email' | 'customer_note';
const limits: Record<Field, [min: number, max: number]> = {
  first_name: [2, 60],
  last_name: [2, 60],
  street: [2, 120],
  house_number: [1, 20],
  apartment: [0, 20],
  city: [2, 60],
  postal_code: [5, 5],
  phone: [6, 30],
  email: [5, 200],
  customer_note: [0, 1000],
};

/** Serbian numbers: 06x…, 0xx… or +381…; stored as +381… so the same customer matches across orders. */
function normalizePhone(raw: string): string | null {
  let d = raw.replace(/[\s\-/().]/g, '');
  if (d.startsWith('00')) d = `+${d.slice(2)}`;
  if (d.startsWith('+381')) d = d.slice(4);
  else if (d.startsWith('0')) d = d.slice(1);
  else return null;
  if (d.startsWith('0')) d = d.slice(1);
  return /^\d{7,10}$/.test(d) ? `+381${d}` : null;
}

function validate(body: Record<string, unknown>) {
  const errors: Partial<Record<Field | 'items' | 'consent', string>> = {};
  const v = {} as Record<Field, string>;
  for (const [k, [min, max]] of Object.entries(limits) as [Field, [number, number]][]) {
    // Collapse spaces; the note keeps its line breaks.
    const s = String(body[k] ?? '').replace(k === 'customer_note' ? /[ \t]+/g : /\s+/g, ' ').trim();
    v[k] = s;
    if (s.length < min || s.length > max) errors[k] = 'invalid';
  }
  if (!/^\d{5}$/.test(v.postal_code)) errors.postal_code = 'invalid';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) errors.email = 'invalid';
  const phone = normalizePhone(v.phone);
  if (!phone) errors.phone = 'invalid';
  else v.phone = phone;
  if (body.consent !== true) errors.consent = 'required';

  const items = Array.isArray(body.items) ? body.items : [];
  const clean = items
    .slice(0, 50)
    .map((i) => ({ sku: String((i as { sku?: unknown }).sku ?? '').slice(0, 60), qty: Math.min(99, Math.max(1, Math.floor(Number((i as { qty?: unknown }).qty) || 1))) }))
    .filter((i) => i.sku);
  if (!clean.length) errors.items = 'empty';
  return { errors, values: v, items: clean };
}

// ---------------------------------------------------------------------------
// Emails
// ---------------------------------------------------------------------------
interface PlacedItem { sku: string; name: string; qty: number; unit_price: number; line_total: number; made_to_order: boolean }
interface Placed { order_id: number; order_number: string; items_total: number; created_at: string; items: PlacedItem[]; duplicate: boolean }

const rsd = (n: number) => `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} RSD`;
const fill = (tpl: string, vars: Record<string, string>) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
const setting = (rows: { key: string; value: unknown }[], key: string) => {
  const v = rows.find((r) => r.key === key)?.value;
  return v === null || v === undefined ? null : v;
};

async function sendEmails(admin: ReturnType<typeof createClient>, placed: Placed, v: Record<Field, string>) {
  const [{ data: settings, error: e1 }, { data: templates, error: e2 }] = await Promise.all([
    admin.from('settings').select('key, value').in('key', ['partner_order_email', 'admin_notify_email', 'email_test_mode', 'order_sender_email', 'delivery_estimate']),
    admin.from('email_templates').select('key, subject, body').eq('is_active', true).in('key', ['order_to_partner', 'order_confirmation']),
  ]);
  if (e1 || e2) throw new Error(`email setup: ${(e1 ?? e2)!.message}`);
  const s = settings ?? [];
  const testMode = setting(s, 'email_test_mode') !== false;
  const adminEmail = String(setting(s, 'admin_notify_email') ?? 'daniel.zec@vodanatura.com');
  const partnerEmail = setting(s, 'partner_order_email') as string | null;
  const sender = String(setting(s, 'order_sender_email') ?? 'narudzbine@vodanatura.com');
  const tpl = (key: string) => templates?.find((t) => t.key === key);

  const madeToOrder = placed.items.some((i) => i.made_to_order);
  const date = new Intl.DateTimeFormat('sr-Latn-RS', { timeZone: 'Europe/Belgrade', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(placed.created_at));
  const vars: Record<string, string> = {
    order_number: placed.order_number,
    order_date: date,
    first_name: v.first_name,
    last_name: v.last_name,
    street: v.street,
    house_number: v.house_number,
    apartment: v.apartment || '—',
    city: v.city,
    postal_code: v.postal_code,
    phone: v.phone,
    email: v.email,
    customer_note: v.customer_note || '—',
    items: placed.items
      .map((i) => `- ${i.qty} × ${i.name} (šifra ${i.sku}) – ${rsd(i.line_total)}${i.made_to_order ? ' – po porudžbini, 3–4 meseca' : ''}`)
      .join('\n'),
    total: rsd(placed.items_total),
    delivery_estimate: String(setting(s, 'delivery_estimate') ?? 'oko 4 radna dana'),
    address: `${v.first_name} ${v.last_name}\n${v.street} ${v.house_number}${v.apartment ? `, stan ${v.apartment}` : ''}\n${v.postal_code} ${v.city}\nTelefon: ${v.phone}`,
    made_to_order_note: madeToOrder
      ? 'Napomena: neki proizvodi se isporučuju po porudžbini (3–4 meseca). Decor Ambient će vas pozvati da dogovorite da li porudžbinu šaljemo zajedno ili odvojeno.'
      : '',
  };

  type Mail = { template: string; to: string | null; subject: string; body: string };
  const mails: Mail[] = [];
  const partner = tpl('order_to_partner');
  const customer = tpl('order_confirmation');
  if (partner) mails.push({ template: 'order_to_partner', to: partnerEmail, subject: fill(partner.subject, vars), body: fill(partner.body, vars) });
  if (customer) mails.push({ template: 'order_confirmation', to: v.email, subject: fill(customer.subject, vars), body: fill(customer.body, vars).replace(/\n{3,}/g, '\n\n') });
  if (partner && !testMode) mails.push({ template: 'order_admin_copy', to: adminEmail, subject: `Kopija: ${fill(partner.subject, vars)}`, body: fill(partner.body, vars) });

  const user = Deno.env.get('GMAIL_SMTP_USER');
  const pass = Deno.env.get('GMAIL_SMTP_PASSWORD');
  const client = user && pass
    ? new SMTPClient({ connection: { hostname: 'smtp.gmail.com', port: 465, tls: true, auth: { username: user, password: pass } } })
    : null;

  let partnerSent = false;
  for (const m of mails) {
    const to = testMode ? adminEmail : m.to;
    const subject = testMode ? `[TEST → ${m.to ?? 'DA adresa nije podešena'}] ${m.subject}` : m.subject;
    let status: 'sent' | 'failed' | 'queued' = 'queued';
    let error: string | null = null;
    if (!to) {
      status = 'failed';
      error = 'Adresa Decor Ambient-a za porudžbine nije podešena (Emailovi → Podešavanja).';
    } else if (!client) {
      error = 'Slanje nije podešeno: nedostaje Gmail lozinka za aplikaciju (GMAIL_SMTP_USER / GMAIL_SMTP_PASSWORD).';
    } else {
      try {
        await client.send({ from: `VodaNatura <${sender}>`, replyTo: sender, to, subject, content: m.body });
        status = 'sent';
        if (m.template === 'order_to_partner' && !testMode) partnerSent = true;
      } catch (e) {
        status = 'failed';
        error = String(e instanceof Error ? e.message : e).slice(0, 500);
      }
    }
    const { error: logError } = await admin.from('email_log').insert({ order_id: placed.order_id, template: m.template, recipient: to ?? '—', subject, status, error });
    if (logError) console.error('email_log insert failed', logError.message);
  }
  if (client) await client.close().catch(() => {});
  if (partnerSent) {
    const { error: upError } = await admin.from('orders').update({ status: 'sent_to_partner' }).eq('id', placed.order_id).eq('status', 'new');
    if (upError) console.error('status update failed', upError.message);
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  // Bots fill the hidden "website" field.
  if (body.website) return json({ error: 'bad_request' }, 400);

  const { errors, values, items } = validate(body);
  if (Object.keys(errors).length) return json({ error: 'invalid', fields: errors }, 422);

  const token = typeof body.client_token === 'string' && /^[0-9a-f-]{36}$/i.test(body.client_token) ? body.client_token : null;
  const source = typeof body.source === 'string' ? body.source.slice(0, 300) : null;

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data, error } = await admin.rpc('place_order', { p: { ...values, items, client_token: token, source } });
  if (error) {
    const msg = error.message ?? '';
    if (msg.includes('rate_limited')) return json({ error: 'rate_limited' }, 429);
    if (msg.includes('empty_cart')) return json({ error: 'empty_cart' }, 400);
    const m = msg.match(/unavailable:([^\s"]+)/);
    if (m) return json({ error: 'unavailable', skus: m[1].split(',') }, 409);
    console.error('place_order failed', msg);
    return json({ error: 'server' }, 500);
  }

  const placed = data as Placed;
  if (!placed.duplicate) {
    const job = sendEmails(admin, placed, values).catch((e) => console.error('emails failed', e));
    if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(job);
    else await job;
  }
  return json({ order_number: placed.order_number, items_total: placed.items_total, items: placed.items, duplicate: placed.duplicate });
});
