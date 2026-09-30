-- Admin panel (30 Sep 2026): everything the admin screens need that the core schema did not have yet.
-- See the Admin Panel Guide (claude.ai project) and docs/admin-panel.md in this repo.

-- ---------------------------------------------------------------------------
-- 1. Two-step login: admin data needs a session that passed the second step (aal2).
-- ---------------------------------------------------------------------------
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
     and exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()));
$$;

-- Lets the login screen tell "not an admin" apart from "second step missing".
create or replace function public.admin_status()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'listed', exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())),
    'aal', coalesce((select auth.jwt() ->> 'aal'), '')
  );
$$;
revoke execute on function public.admin_status() from public, anon;
grant execute on function public.admin_status() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Stock: made-to-order is a product property, stock state follows the quantity.
-- ---------------------------------------------------------------------------
alter table public.products add column if not exists made_to_order boolean not null default false;
comment on column public.products.made_to_order is
  'When stock is 0 the product stays orderable as "Po porudžbini, 3–4 meseca" instead of "Nema na stanju".';
update public.products set made_to_order = true where stock_state = 'made_to_order';

-- Codes of this product in Decor Ambient's accounting file, normalised (A–Z and 0–9 only,
-- supplier suffixes KL/DW/USTM/KOM/AQV removed). Empty = use the SKU.
alter table public.product_internal add column if not exists stock_codes text[] not null default '{}';

alter table public.stock_imports add column if not exists undone_at timestamptz;

-- Apply one import atomically. p_changes = [{"product_id": 1, "qty": 5}, …].
create or replace function public.admin_apply_stock_import(
  p_file_name text, p_changes jsonb, p_summary jsonb, p_status text, p_rows_read int, p_rows_matched int, p_rows_failed int
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_prev jsonb;
  v_id bigint;
begin
  if not (select private.is_admin()) then raise exception 'not allowed'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'product_id', p.id, 'stock_qty', p.stock_qty, 'stock_state', p.stock_state, 'stock_updated_at', p.stock_updated_at)), '[]'::jsonb)
    into v_prev
    from public.products p
   where p.id in (select (c ->> 'product_id')::bigint from jsonb_array_elements(p_changes) c);

  update public.products p
     set stock_qty = greatest(0, (c ->> 'qty')::int),
         stock_state = case when (c ->> 'qty')::int > 0 then 'in_stock'::public.stock_state
                            when p.made_to_order then 'made_to_order'::public.stock_state
                            else 'out_of_stock'::public.stock_state end,
         stock_updated_at = now()
    from jsonb_array_elements(p_changes) c
   where p.id = (c ->> 'product_id')::bigint;

  insert into public.stock_imports (file_name, status, rows_read, rows_matched, rows_failed, summary, previous_stock)
  values (p_file_name, p_status, p_rows_read, p_rows_matched, p_rows_failed, p_summary, v_prev)
  returning id into v_id;
  return v_id;
end;
$$;

-- Undo: only the latest import that is not undone yet.
create or replace function public.admin_undo_stock_import(p_id bigint)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_latest bigint;
begin
  if not (select private.is_admin()) then raise exception 'not allowed'; end if;
  select id into v_latest from public.stock_imports where status <> 'undone' order by created_at desc limit 1;
  if v_latest is distinct from p_id then raise exception 'Only the latest import can be undone'; end if;

  update public.products p
     set stock_qty = (s ->> 'stock_qty')::int,
         stock_state = (s ->> 'stock_state')::public.stock_state,
         stock_updated_at = (s ->> 'stock_updated_at')::timestamptz
    from public.stock_imports i, jsonb_array_elements(i.previous_stock) s
   where i.id = p_id and p.id = (s ->> 'product_id')::bigint;

  update public.stock_imports set status = 'undone', undone_at = now() where id = p_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Prices: price history records where a change came from (sync, override, bulk, manual).
-- ---------------------------------------------------------------------------
create or replace function public.log_price_change()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_source text := nullif(current_setting('vn.price_source', true), '');
begin
  if tg_op = 'INSERT' or new.sale_price is distinct from old.sale_price then
    insert into public.price_history (product_id, old_price, new_price, source)
    values (new.id, case when tg_op = 'UPDATE' then old.sale_price end, new.sale_price,
            coalesce(v_source,
              case when tg_op = 'INSERT' then 'import' when new.price_mode = 'auto' then 'sync' else 'override' end));
  end if;
  return new;
end;
$$;

-- One product or many at once. p_mode auto resets the correction.
create or replace function public.admin_set_prices(p_ids bigint[], p_mode public.price_mode, p_value numeric, p_source text)
returns int
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count int;
begin
  if not (select private.is_admin()) then raise exception 'not allowed'; end if;
  if p_source not in ('override', 'bulk', 'manual') then raise exception 'bad source'; end if;
  perform set_config('vn.price_source', p_source, true);
  update public.products
     set price_mode = p_mode,
         price_override = case when p_mode = 'auto' then null else p_value end
   where id = any (p_ids);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Orders: status change with a note in the history.
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_order_status(p_order_id bigint, p_status public.order_status, p_note text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then raise exception 'not allowed'; end if;
  update public.orders set status = p_status where id = p_order_id;
  if nullif(trim(coalesce(p_note, '')), '') is not null then
    update public.order_status_history
       set note = p_note
     where id = (select max(id) from public.order_status_history where order_id = p_order_id);
  end if;
end;
$$;

-- Customers are built from orders (guest checkout), grouped by email.
create or replace view public.admin_customers
with (security_invoker = true)
as
select
  lower(o.email) as email,
  (array_agg(o.first_name || ' ' || o.last_name order by o.created_at desc))[1] as name,
  (array_agg(o.phone order by o.created_at desc))[1] as phone,
  (array_agg(o.city order by o.created_at desc))[1] as city,
  count(*)::int as orders_count,
  coalesce(sum(o.items_total) filter (where o.status not in ('cancelled', 'refused', 'returned')), 0)::int as total_ordered,
  max(o.created_at) as last_order_at,
  min(o.created_at) as first_order_at
from public.orders o
where o.email <> ''
group by lower(o.email);

-- Delete a customer's personal data on request: orders stay for commission, personal fields are erased.
create or replace function public.admin_anonymize_customer(p_email text)
returns int
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count int;
begin
  if not (select private.is_admin()) then raise exception 'not allowed'; end if;
  update public.orders
     set first_name = 'Obrisano', last_name = '', street = '', house_number = '', apartment = null,
         postal_code = '', phone = '', email = '', customer_note = null
   where lower(email) = lower(p_email);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Product documents (PDF manuals, certificates).
-- ---------------------------------------------------------------------------
create table if not exists public.product_documents (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  title text not null,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists product_documents_product_idx on public.product_documents (product_id);
alter table public.product_documents enable row level security;
create policy "public reads documents of visible products" on public.product_documents
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.is_visible));
create policy "admin all product_documents" on public.product_documents
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- 6. Email templates.
-- ---------------------------------------------------------------------------
create table if not exists public.email_templates (
  key text primary key,
  name text not null,
  recipient text not null check (recipient in ('partner', 'customer')),
  subject text not null,
  body text not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);
create trigger email_templates_touch before update on public.email_templates
  for each row execute function public.touch_updated_at();
alter table public.email_templates enable row level security;
create policy "admin all email_templates" on public.email_templates
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

insert into public.email_templates (key, name, recipient, subject, body) values
('order_to_partner', 'Nova porudžbina (Decor Ambient)', 'partner',
 'Nova porudžbina {order_number} – VodaNatura',
 E'Poštovani,\n\nnova porudžbina sa sajta VodaNatura:\n\nBroj porudžbine: {order_number}\nDatum: {order_date}\n\nIme: {first_name}\nPrezime: {last_name}\nUlica: {street}\nBroj: {house_number}\nStan: {apartment}\nGrad: {city}\nPoštanski broj: {postal_code}\nTelefon: {phone}\nEmail: {email}\n\nProizvodi:\n{items}\n\nUkupno (proizvodi, sa PDV-om): {total}\nPlaćanje: pouzećem\n\nNapomena kupca: {customer_note}\n\nMolimo da status porudžbine javite odgovorom na ovaj email.\n\nVodaNatura'),
('order_confirmation', 'Potvrda porudžbine (kupac)', 'customer',
 'Primili smo vašu porudžbinu {order_number}',
 E'Poštovani/a {first_name},\n\nhvala na porudžbini! Primili smo je i prosledili na pakovanje.\n\nBroj porudžbine: {order_number}\n\n{items}\n\nUkupno za proizvode: {total}\nPlaćanje: pouzećem, kada paket stigne.\nTroškove dostave plaćate kuriru prilikom preuzimanja.\nDostava: {delivery_estimate}.\n\nAdresa dostave:\n{address}\n\nAko imate pitanje, samo odgovorite na ovaj email.\n\nVodaNatura – Filteri vode za vaš dom')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 7. Marketing: hero and banners with a schedule.
-- ---------------------------------------------------------------------------
create table if not exists public.banners (
  id bigint generated always as identity primary key,
  placement text not null check (placement in ('hero', 'promo', 'announcement')),
  title text not null,
  body text,
  button_label text,
  button_url text,
  image_desktop text,
  image_mobile text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_draft boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger banners_touch before update on public.banners
  for each row execute function public.touch_updated_at();
alter table public.banners enable row level security;
create policy "public reads live banners" on public.banners
  for select to anon, authenticated
  using (not is_draft and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy "admin all banners" on public.banners
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- 8. Settings used by the dashboard and the price sync screen.
-- ---------------------------------------------------------------------------
insert into public.settings (key, value, is_public, description) values
  ('order_stuck_days', '3', false, 'Dashboard warns when an order stays in one status longer than this.'),
  ('stock_import_warn_days', '7', false, 'Dashboard warns when the last stock import is older than this.'),
  ('price_sync_last_run', 'null', false, 'Time of the last price sync with decorambient.com.'),
  ('price_sync_status', 'null', false, 'Result of the last price sync: {ok, changed, unmatched[]}.'),
  ('admin_idle_minutes', '30', false, 'Admin is logged out after this many minutes without activity.')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 9. Image and document storage (public read, admin write).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf'])
on conflict (id) do nothing;

create policy "admin uploads media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and (select private.is_admin()));
create policy "admin updates media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and (select private.is_admin()));
create policy "admin deletes media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and (select private.is_admin()));

-- ---------------------------------------------------------------------------
-- 10. API privileges (this project does not grant them automatically).
-- ---------------------------------------------------------------------------
grant select on public.product_documents, public.banners to anon, authenticated;
grant select, insert, update, delete on public.product_documents, public.email_templates, public.banners to authenticated;
grant select on public.admin_customers to authenticated;
grant usage, select on all sequences in schema public to authenticated;

revoke execute on function public.admin_apply_stock_import(text, jsonb, jsonb, text, int, int, int) from public, anon;
revoke execute on function public.admin_undo_stock_import(bigint) from public, anon;
revoke execute on function public.admin_set_prices(bigint[], public.price_mode, numeric, text) from public, anon;
revoke execute on function public.admin_set_order_status(bigint, public.order_status, text) from public, anon;
revoke execute on function public.admin_anonymize_customer(text) from public, anon;
grant execute on function public.admin_apply_stock_import(text, jsonb, jsonb, text, int, int, int) to authenticated;
grant execute on function public.admin_undo_stock_import(bigint) to authenticated;
grant execute on function public.admin_set_prices(bigint[], public.price_mode, numeric, text) to authenticated;
grant execute on function public.admin_set_order_status(bigint, public.order_status, text) to authenticated;
grant execute on function public.admin_anonymize_customer(text) to authenticated;

-- Applied as a second migration (admin_status_invoker): admin_status runs as the caller,
-- who may read only their own admin_users row.
create policy "user reads own admin row" on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.admin_status()
returns jsonb language sql stable security invoker set search_path = ''
as $$
  select jsonb_build_object(
    'listed', exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())),
    'aal', coalesce((select auth.jwt() ->> 'aal'), '')
  );
$$;
