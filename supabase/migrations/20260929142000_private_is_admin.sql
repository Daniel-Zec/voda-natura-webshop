-- Security advisor: keep SECURITY DEFINER helpers out of the public API schema.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()));
$$;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

do $$
declare t text;
begin
  foreach t in array array['admin_users','settings','categories','products','product_internal','commission_rules',
                           'product_images','price_history','stock_imports','orders','order_items',
                           'order_status_history','email_log']
  loop
    execute format('drop policy if exists "admin all %1$s" on public.%1$I', t);
    execute format('create policy "admin all %1$s" on public.%1$I for all to authenticated
                    using ((select private.is_admin())) with check ((select private.is_admin()))', t);
  end loop;
end $$;

drop function public.is_admin();

-- Supabase-provided helper; nobody needs to call it through the API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
