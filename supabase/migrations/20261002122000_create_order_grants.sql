-- The create-order Edge Function runs as service_role. This project doesn't grant tables to the
-- API roles by default, so give it only what the order emails need (2 Oct 2026):
-- read settings and templates, write the email log. (The orders grant below is revoked again in
-- 20261002123000_mark_order_sent.sql; the status change goes through a function.)
-- Orders themselves are created through place_order() (security definer).
grant select on public.settings, public.email_templates to service_role;
grant insert on public.email_log to service_role;
grant select (id, status), update (status) on public.orders to service_role;
