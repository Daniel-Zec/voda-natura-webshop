-- VodaNatura core schema: catalogue, pricing, commission, settings, orders.
-- Follows the Admin Panel Guide (25 Sep 2026) and the decisions in Jira VODANATURA-75 (29 Sep 2026).

-- ---------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);
comment on table public.admin_users is 'Users allowed into the admin panel. One admin (Daniel) at launch.';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()));
$$;

-- updated_at helper
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Settings (key/value). Public keys are readable by the shop.
-- ---------------------------------------------------------------------------
create table public.settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false,
  description text,
  updated_at timestamptz not null default now()
);
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table public.categories (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  parent_id bigint references public.categories (id) on delete set null,
  description text,
  intro text,                          -- 60–100 word intro above the grid (SEO guide)
  sort_order int not null default 0,
  show_in_menu boolean not null default true,
  is_visible boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index categories_parent_idx on public.categories (parent_id);
create trigger categories_touch before update on public.categories
  for each row execute function public.touch_updated_at();

create type public.stock_state as enum ('in_stock', 'out_of_stock', 'made_to_order');
create type public.price_mode as enum ('auto', 'fixed', 'percent');

create table public.products (
  id bigint generated always as identity primary key,
  sku text not null unique,
  slug text not null unique,
  name text not null,
  category_id bigint references public.categories (id) on delete set null,
  kicker text,                          -- short "where / what" line on cards
  summary text,                         -- 1–2 sentences, function only
  description_html text,                -- public long text (to be rewritten, see content_status)
  specs jsonb not null default '[]'::jsonb,   -- [{label, value}]
  maintenance text,                     -- yearly running cost line
  badge_label text,
  badge_tone text check (badge_tone in ('info','natura','sand','success','warning','neutral')),

  -- Price (all prices with VAT, RSD)
  partner_price integer not null check (partner_price >= 0),   -- synced from decorambient.com
  price_mode public.price_mode not null default 'auto',
  price_override numeric(10,2),         -- fixed RSD, or % on top of partner price
  sale_price integer generated always as (
    case price_mode
      when 'fixed' then coalesce(price_override, partner_price)::integer
      when 'percent' then (round(partner_price * (1 + coalesce(price_override, 0) / 100) / 10) * 10)::integer
      else partner_price
    end
  ) stored,

  -- Stock (from the DA Excel import; stock only)
  stock_state public.stock_state not null default 'in_stock',
  stock_qty integer,
  stock_updated_at timestamptz,

  -- Visibility and data quality
  is_visible boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  content_status text not null default 'partner_copy'
    check (content_status in ('partner_copy', 'rewritten', 'approved')),

  -- Source (public anyway on decorambient.com)
  partner_product_id integer unique,    -- WooCommerce id on decorambient.com
  partner_url text,

  -- SEO
  seo_title text,
  seo_description text,
  primary_keyword text,

  weight_kg numeric(8,3),
  dimensions_cm jsonb,                  -- {length, width, height}

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create index products_visible_idx on public.products (is_visible) where is_visible;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

-- Internal product data: admin only (partner texts, data problems).
create table public.product_internal (
  product_id bigint primary key references public.products (id) on delete cascade,
  partner_name text,
  partner_description_html text,
  data_notes text,
  updated_at timestamptz not null default now()
);

-- Commission rules: admin only. Most specific wins: product → category → default setting.
create table public.commission_rules (
  id bigint generated always as identity primary key,
  category_id bigint unique references public.categories (id) on delete cascade,
  product_id bigint unique references public.products (id) on delete cascade,
  pct numeric(5,2) not null check (pct between 0 and 100),
  updated_at timestamptz not null default now(),
  check ((category_id is null) <> (product_id is null))
);

create or replace function public.commission_pct_for(p_product_id bigint)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select r.pct from public.commission_rules r where r.product_id = p_product_id),
    (select r.pct from public.commission_rules r
       join public.products p on p.category_id = r.category_id where p.id = p_product_id),
    (select r.pct from public.commission_rules r
       join public.categories c on c.parent_id = r.category_id
       join public.products p on p.category_id = c.id where p.id = p_product_id),
    (select nullif(s.value #>> '{}', 'null')::numeric from public.settings s where s.key = 'commission_default_pct'),
    0
  );
$$;
revoke execute on function public.commission_pct_for(bigint) from anon, authenticated, public;

create table public.product_images (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  src text not null,                    -- absolute URL, or a path under the site's /images/
  alt text not null default '',
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id);

create table public.price_history (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  old_price integer,
  new_price integer not null,
  source text not null check (source in ('sync', 'override', 'bulk', 'import', 'manual')),
  changed_at timestamptz not null default now()
);
create index price_history_product_idx on public.price_history (product_id, changed_at desc);

create or replace function public.log_price_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.sale_price is distinct from old.sale_price then
    insert into public.price_history (product_id, old_price, new_price, source)
    values (new.id, case when tg_op = 'UPDATE' then old.sale_price end, new.sale_price,
            case when tg_op = 'INSERT' then 'import' when new.price_mode = 'auto' then 'sync' else 'override' end);
  end if;
  return new;
end;
$$;
create trigger products_price_history after insert or update of partner_price, price_mode, price_override
  on public.products for each row execute function public.log_price_change();

create table public.stock_imports (
  id bigint generated always as identity primary key,
  file_name text not null,
  status text not null check (status in ('success', 'warnings', 'failed', 'undone')),
  rows_read int not null default 0,
  rows_matched int not null default 0,
  rows_failed int not null default 0,
  summary jsonb not null default '{}'::jsonb,
  previous_stock jsonb not null default '[]'::jsonb,  -- for Undo
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create type public.order_status as enum (
  'new', 'sent_to_partner', 'processing', 'shipped', 'delivered', 'completed',
  'refused', 'returned', 'cancelled'
);

create sequence public.order_number_seq start 1;

create table public.orders (
  id bigint generated always as identity primary key,
  order_number text not null unique
    default ('VN-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_number_seq')::text, 4, '0')),
  status public.order_status not null default 'new',
  -- Customer (format agreed with DA: Ime, Prezime, Ulica, Broj, Stan, Grad, Poštanski broj, Telefon, Email)
  first_name text not null,
  last_name text not null,
  street text not null,
  house_number text not null,
  apartment text,
  city text not null,
  postal_code text not null,
  phone text not null,
  email text not null,
  customer_note text,
  internal_note text,
  -- Totals (products only; shipping is paid to the courier)
  items_total integer not null default 0,
  commission_total numeric(12,2) not null default 0,
  tracking_code text,
  source text,                           -- UTM / referrer
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_status_idx on public.orders (status);
create index orders_created_idx on public.orders (created_at desc);
create index orders_phone_idx on public.orders (phone);
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders (id) on delete cascade,
  product_id bigint references public.products (id) on delete set null,
  sku text not null,
  name text not null,
  unit_price integer not null,           -- sale price at order time
  quantity integer not null check (quantity > 0),
  line_total integer generated always as (unit_price * quantity) stored,
  commission_pct numeric(5,2) not null default 0,   -- rate at order time
  commission_amount numeric(12,2) generated always as (round(unit_price * quantity * commission_pct / 100, 2)) stored
);
create index order_items_order_idx on public.order_items (order_id);

create table public.order_status_history (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  note text,
  changed_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history (order_id, changed_at);

create or replace function public.log_order_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history (order_id, from_status, to_status) values (new.id, null, new.status);
  elsif new.status is distinct from old.status then
    insert into public.order_status_history (order_id, from_status, to_status) values (new.id, old.status, new.status);
    if new.status = 'delivered' and new.delivered_at is null then
      new.delivered_at = now();
    end if;
  end if;
  return new;
end;
$$;
create trigger orders_status_log_ins after insert on public.orders
  for each row execute function public.log_order_status();
create trigger orders_status_log_upd before update of status on public.orders
  for each row execute function public.log_order_status();

create table public.email_log (
  id bigint generated always as identity primary key,
  order_id bigint references public.orders (id) on delete set null,
  template text not null,                -- 'order_to_partner', 'order_confirmation', …
  recipient text not null,
  subject text not null,
  status text not null check (status in ('queued', 'sent', 'failed')),
  error text,
  created_at timestamptz not null default now()
);
create index email_log_order_idx on public.email_log (order_id);

-- ---------------------------------------------------------------------------
-- Commission view: pending / earned / cancelled per order line.
-- Earned = delivered or completed, and more than `commission_earn_days` (default 7) since delivery.
-- ---------------------------------------------------------------------------
create or replace view public.commission_lines
with (security_invoker = true)
as
select
  oi.id as order_item_id,
  o.id as order_id,
  o.order_number,
  o.created_at as ordered_at,
  o.delivered_at,
  o.status as order_status,
  oi.sku,
  oi.name,
  oi.quantity,
  oi.line_total,
  oi.commission_pct,
  oi.commission_amount,
  case
    when o.status in ('cancelled', 'refused', 'returned') then 'cancelled'
    when o.status in ('delivered', 'completed')
      and o.delivered_at is not null
      and o.delivered_at + make_interval(days => coalesce(
            (select (s.value #>> '{}')::int from public.settings s where s.key = 'commission_earn_days'), 7)) <= now()
      then 'earned'
    else 'pending'
  end as commission_status
from public.order_items oi
join public.orders o on o.id = oi.order_id;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.admin_users enable row level security;
alter table public.settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_internal enable row level security;
alter table public.commission_rules enable row level security;
alter table public.price_history enable row level security;
alter table public.stock_imports enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.email_log enable row level security;

-- Shop (anyone): read the visible catalogue and public settings. Nothing else.
create policy "public reads visible categories" on public.categories
  for select to anon, authenticated using (is_visible);
create policy "public reads visible products" on public.products
  for select to anon, authenticated using (is_visible);
create policy "public reads images of visible products" on public.product_images
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.is_visible));
create policy "public reads public settings" on public.settings
  for select to anon, authenticated using (is_public);

-- Admin: everything. Orders are created by the checkout function (service role), never by the browser.
create policy "admin all admin_users" on public.admin_users for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin all settings" on public.settings for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin all categories" on public.categories for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin all products" on public.products for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin all product_internal" on public.product_internal for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin all commission_rules" on public.commission_rules for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin all product_images" on public.product_images for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin all price_history" on public.price_history for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin all stock_imports" on public.stock_imports for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin all orders" on public.orders for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin all order_items" on public.order_items for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin all order_status_history" on public.order_status_history for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin all email_log" on public.email_log for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));


-- ---------------------------------------------------------------------------
-- Default settings
-- ---------------------------------------------------------------------------
insert into public.settings (key, value, is_public, description) values
  ('commission_default_pct', 'null', false, 'Default commission % (with VAT). Still to agree with Decor Ambient.'),
  ('commission_earn_days', '7', false, 'Days after delivery before commission counts as earned (VODANATURA-75 q.3).'),
  ('partner_order_email', 'null', false, 'Decor Ambient address that receives new orders. Still missing.'),
  ('order_sender_email', '"narudzbine@vodanatura.com"', false, 'Sender of order emails.'),
  ('email_test_mode', 'true', false, 'true = every email goes to the admin instead of DA/customers.'),
  ('admin_notify_email', '"daniel.zec@vodanatura.com"', false, 'Copy of every order.'),
  ('price_rounding_rsd', '10', false, 'Round percentage prices to this many RSD.'),
  ('shop_phone', '"[TELEFON]"', true, 'Public phone for help.'),
  ('shop_hours', '"Radnim danima [RADNO VREME]"', true, 'Public working hours.'),
  ('delivery_estimate', '"oko 4 radna dana"', true, 'Shown at checkout and in FAQ.'),
  ('installation_phone', '"[TELEFON DECOR AMBIENT]"', true, 'Decor Ambient phone for booking installation in Subotica.'),
  ('installation_price', '"[CENA UGRADNJE]"', true, 'Installation price in Subotica.');
