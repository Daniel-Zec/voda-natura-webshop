-- create-order marks an order as sent to Decor Ambient after the DA email goes out.
-- A status change also writes order_status_history (trigger), so do it in one security definer
-- function instead of granting service_role more tables (2 Oct 2026).
create or replace function public.mark_order_sent_to_partner(p_order_id bigint)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.orders set status = 'sent_to_partner' where id = p_order_id and status = 'new';
$$;
revoke execute on function public.mark_order_sent_to_partner(bigint) from public, anon, authenticated;
grant execute on function public.mark_order_sent_to_partner(bigint) to service_role;

-- No longer needed directly.
revoke update (status) on public.orders from service_role;
revoke select (id, status) on public.orders from service_role;
