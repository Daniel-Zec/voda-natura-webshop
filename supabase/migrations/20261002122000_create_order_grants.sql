-- The create-order Edge Function runs as service_role. This project doesn't grant tables to the
-- API roles by default, so give it only what the order emails need (2 Oct 2026):
-- read settings and templates, write the email log, move the order to sent_to_partner.
-- Orders themselves are created through place_order() (security definer).
grant select on public.settings, public.email_templates to service_role;
grant insert on public.email_log to service_role;
grant select (id, status), update (status) on public.orders to service_role;
