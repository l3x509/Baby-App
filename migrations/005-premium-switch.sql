-- =====================================================================
-- Bebenou: Premium on/off switch per person
-- Run once in Supabase: SQL Editor → New query → paste → Run. Safe to run again.
--
-- How to use it: Table Editor → premium_access. Every account has a row
-- (new sign-ups are added on their own). Tick "premium" to turn Premium on,
-- untick to turn it off. Everyone on that person's baby logs gets it too.
-- It sits on top of paid subscriptions and never changes them.
-- =====================================================================

create table if not exists public.premium_access (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  premium    boolean not null default false,
  note       text,
  updated_at timestamptz not null default now()
);

-- Private: only you (the dashboard) can see or change this table.
alter table public.premium_access enable row level security;
revoke all on public.premium_access from anon, authenticated;

-- Add everyone who already has an account.
insert into public.premium_access (user_id, email)
select id, email from auth.users
on conflict (user_id) do update set email = excluded.email;

-- Add new accounts automatically, and keep the email current.
create or replace function public.premium_access_sync_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.premium_access (user_id, email) values (new.id, new.email)
  on conflict (user_id) do update set email = excluded.email;
  return new;
exception when others then
  return new;  -- never block a sign-up
end $$;
drop trigger if exists premium_access_sync_user on auth.users;
create trigger premium_access_sync_user after insert or update of email on auth.users
  for each row execute function public.premium_access_sync_user();

create or replace function public.premium_access_touch() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists premium_access_touch on public.premium_access;
create trigger premium_access_touch before update on public.premium_access
  for each row execute function public.premium_access_touch();

-- The app asks: does anyone on this baby's log have the switch on?
-- Answers only for logs you belong to, and reveals nothing else.
create or replace function public.log_premium_grant(b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_member(b) and exists (
    select 1 from public.baby_members m
    join public.premium_access p on p.user_id = m.user_id
    where m.baby_id = b and p.premium
  )
$$;
revoke all on function public.log_premium_grant(uuid) from public, anon;
grant execute on function public.log_premium_grant(uuid) to authenticated;
