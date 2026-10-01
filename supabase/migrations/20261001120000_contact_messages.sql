-- Contact form (/kontakt/): visitors add messages, the admin reads them in "Poruke" (#/poruke).
-- No email is sent; messages are read in the admin panel (decided 1 Oct 2026).

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 5 and 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (phone is null or char_length(phone) <= 40),
  topic text not null default 'drugo' check (topic in ('izbor', 'ugradnja', 'porudzbina', 'reklamacija', 'drugo')),
  message text not null check (char_length(message) between 5 and 5000),
  page text check (page is null or char_length(page) <= 300),
  status text not null default 'new' check (status in ('new', 'answered', 'forwarded', 'spam'))
);
create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);
create index if not exists contact_messages_email_idx on public.contact_messages (lower(email), created_at desc);
alter table public.contact_messages enable row level security;

-- Website visitors may only add a message (always status 'new'); they can never read any.
drop policy if exists "public insert contact_messages" on public.contact_messages;
create policy "public insert contact_messages" on public.contact_messages
  for insert to anon, authenticated
  with check (status = 'new');

-- Only the admin (admin_users + two-step login) reads, updates and deletes.
drop policy if exists "admin all contact_messages" on public.contact_messages;
create policy "admin all contact_messages" on public.contact_messages
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

revoke all on public.contact_messages from anon;
grant insert (name, email, phone, topic, message, page) on public.contact_messages to anon;
grant select, insert, update, delete on public.contact_messages to authenticated;

-- Spam limit: at most 3 messages per email address in 10 minutes, and 30 per minute in total.
create or replace function private.contact_messages_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.contact_messages
       where lower(email) = lower(new.email) and created_at > now() - interval '10 minutes') >= 3
     or (select count(*) from public.contact_messages
       where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  new.status := 'new';
  new.created_at := now();
  return new;
end;
$$;
drop trigger if exists contact_messages_rate_limit on public.contact_messages;
create trigger contact_messages_rate_limit before insert on public.contact_messages
  for each row execute function private.contact_messages_rate_limit();
