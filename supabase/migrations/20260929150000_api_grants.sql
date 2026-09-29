-- This project does not grant table access to the API roles automatically.
-- Public (anon): read the catalogue and public settings only. Row-level security still limits rows.
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products, public.product_images, public.settings to anon, authenticated;

-- Signed-in users: full table privileges, but every admin table's RLS policy requires private.is_admin(),
-- so a non-admin account still sees and changes nothing beyond the public catalogue.
grant select, insert, update, delete on
  public.admin_users, public.settings, public.categories, public.products, public.product_internal,
  public.commission_rules, public.product_images, public.price_history, public.stock_imports,
  public.orders, public.order_items, public.order_status_history, public.email_log
  to authenticated;
grant select on public.commission_lines to authenticated;
grant usage, select on all sequences in schema public to authenticated;
