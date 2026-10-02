-- Checkout: one database function that turns a cart into an order (2 Oct 2026).
-- Called only by the `create-order` Edge Function with the service role; the browser never
-- writes orders directly. Prices and commission come from the database, never from the browser.
--
-- Rules (Daniel, 2 Oct 2026):
--   * Out-of-stock products can't be ordered. Everything else (in stock, made to order) can,
--     in one order; Decor Ambient calls the customer if something is missing or must wait.
--   * Shipping is not part of the order total (paid to the courier).

-- Same order sent twice (double click, slow network) creates one order.
alter table public.orders add column if not exists client_token uuid unique;

create or replace function public.place_order(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_missing text[];
  v_items jsonb;
begin
  -- Idempotency: the browser sends one random token per checkout attempt.
  if nullif(p->>'client_token', '') is not null then
    select * into v_order from public.orders where client_token = (p->>'client_token')::uuid;
    if found then
      return jsonb_build_object('order_id', v_order.id, 'order_number', v_order.order_number, 'duplicate', true);
    end if;
  end if;

  -- Light spam guard: at most 3 orders per phone number in 10 minutes.
  if (select count(*) from public.orders
       where phone = p->>'phone' and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'rate_limited';
  end if;

  if jsonb_typeof(p->'items') is distinct from 'array'
     or jsonb_array_length(p->'items') = 0
     or jsonb_array_length(p->'items') > 50 then
    raise exception 'empty_cart';
  end if;

  -- One line per SKU, quantity 1–99.
  drop table if exists _cart;
  create temporary table _cart on commit drop as
    select i->>'sku' as sku, least(greatest(sum(coalesce((i->>'qty')::int, 1)), 1), 99)::int as qty
    from jsonb_array_elements(p->'items') i
    group by i->>'sku';

  select array_agg(c.sku) into v_missing
  from _cart c
  left join public.products pr on pr.sku = c.sku and pr.is_visible and pr.stock_state <> 'out_of_stock'
  where pr.id is null;
  if v_missing is not null then
    raise exception 'unavailable:%', array_to_string(v_missing, ',');
  end if;

  insert into public.orders (
    first_name, last_name, street, house_number, apartment, city, postal_code, phone, email,
    customer_note, source, client_token
  ) values (
    p->>'first_name', p->>'last_name', p->>'street', p->>'house_number', nullif(p->>'apartment', ''),
    p->>'city', p->>'postal_code', p->>'phone', lower(p->>'email'),
    nullif(p->>'customer_note', ''), nullif(p->>'source', ''), nullif(p->>'client_token', '')::uuid
  ) returning * into v_order;

  insert into public.order_items (order_id, product_id, sku, name, unit_price, quantity, commission_pct)
  select v_order.id, pr.id, pr.sku, pr.name, pr.sale_price, c.qty, public.commission_pct_for(pr.id)
  from _cart c join public.products pr on pr.sku = c.sku
  order by pr.name;

  update public.orders o set
    items_total = t.total,
    commission_total = t.commission
  from (select coalesce(sum(line_total), 0)::int as total, coalesce(sum(commission_amount), 0) as commission
        from public.order_items where order_id = v_order.id) t
  where o.id = v_order.id
  returning o.* into v_order;

  select jsonb_agg(jsonb_build_object(
           'sku', oi.sku, 'name', oi.name, 'qty', oi.quantity, 'unit_price', oi.unit_price,
           'line_total', oi.line_total, 'made_to_order', pr.stock_state = 'made_to_order')
         order by oi.id)
    into v_items
  from public.order_items oi left join public.products pr on pr.id = oi.product_id
  where oi.order_id = v_order.id;

  return jsonb_build_object(
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'items_total', v_order.items_total,
    'created_at', v_order.created_at,
    'items', v_items,
    'duplicate', false
  );
end;
$$;

revoke execute on function public.place_order(jsonb) from public, anon, authenticated;
grant execute on function public.place_order(jsonb) to service_role;
