-- =====================================================================
-- Nestling — Supabase schema
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.
-- It is safe to run again; it only creates what's missing and replaces
-- the functions and access rules.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- tables ----------
create table if not exists public.babies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  birth       date not null,
  sex         text not null default 'u' check (sex in ('f','m','u')),
  units       text not null default 'imperial' check (units in ('imperial','metric')),
  teeth       jsonb not null default '{}'::jsonb,
  created_by  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.baby_members (
  baby_id      uuid not null references public.babies(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'parent' check (role in ('owner','parent','viewer')),
  display_name text not null default '',
  joined_at    timestamptz not null default now(),
  primary key (baby_id, user_id)
);

create table if not exists public.invites (
  code        text primary key,
  baby_id     uuid not null references public.babies(id) on delete cascade,
  role        text not null default 'parent' check (role in ('parent','viewer')),
  created_by  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '7 days',
  used_by     uuid references auth.users(id) on delete set null,
  used_at     timestamptz
);

create table if not exists public.entries (
  baby_id     uuid not null references public.babies(id) on delete cascade,
  id          text not null,
  type        text not null,
  start_ms    bigint not null,
  end_ms      bigint,
  data        jsonb not null default '{}'::jsonb,
  created_by  uuid default auth.uid() references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (baby_id, id)
);
create index if not exists entries_baby_start on public.entries (baby_id, start_ms desc);
create index if not exists baby_members_user on public.baby_members (user_id);

-- ---------- helpers ----------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

drop trigger if exists babies_touch on public.babies;
create trigger babies_touch before update on public.babies
  for each row execute function public.touch_updated_at();
drop trigger if exists entries_touch on public.entries;
create trigger entries_touch before update on public.entries
  for each row execute function public.touch_updated_at();

create or replace function public.member_role(b uuid) returns text
language sql stable security definer set search_path = public as $$
  select role from public.baby_members where baby_id = b and user_id = auth.uid()
$$;
create or replace function public.is_member(b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.baby_members where baby_id = b and user_id = auth.uid())
$$;
create or replace function public.can_write(b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.baby_members
                 where baby_id = b and user_id = auth.uid() and role in ('owner','parent'))
$$;

-- ---------- actions the app calls ----------
-- Create a baby and make the caller its owner.
create or replace function public.create_baby(p_name text, p_birth date, p_sex text, p_units text, p_my_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  insert into public.babies (name, birth, sex, units, created_by)
  values (coalesce(nullif(trim(p_name),''),'Baby'), p_birth, coalesce(p_sex,'u'), coalesce(p_units,'imperial'), auth.uid())
  returning id into new_id;
  insert into public.baby_members (baby_id, user_id, role, display_name)
  values (new_id, auth.uid(), 'owner', coalesce(nullif(trim(p_my_name),''),'Parent'));
  return new_id;
end $$;

-- Make a one-time invite code (good for 7 days). Owners and parents can invite.
create or replace function public.create_invite(p_baby uuid, p_role text default 'parent')
returns text language plpgsql security definer set search_path = public as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  c text;
begin
  if not public.can_write(p_baby) then raise exception 'Only parents can invite people'; end if;
  if p_role not in ('parent','viewer') then raise exception 'Unknown role'; end if;
  loop
    c := '';
    for i in 1..8 loop
      c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    begin
      insert into public.invites (code, baby_id, role, created_by) values (c, p_baby, p_role, auth.uid());
      exit;
    exception when unique_violation then
      -- try another code
    end;
  end loop;
  return c;
end $$;

-- Join a baby's log with an invite code.
create or replace function public.accept_invite(p_code text, p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare inv public.invites;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select * into inv from public.invites where code = upper(trim(p_code)) for update;
  if not found then raise exception 'That invite code doesn''t exist. Check it and try again.'; end if;
  if inv.used_by is not null and inv.used_by <> auth.uid() then raise exception 'That invite code was already used. Ask for a new one.'; end if;
  if inv.expires_at < now() then raise exception 'That invite code has expired. Ask for a new one.'; end if;
  insert into public.baby_members (baby_id, user_id, role, display_name)
  values (inv.baby_id, auth.uid(), inv.role, coalesce(nullif(trim(p_name),''),'Parent'))
  on conflict (baby_id, user_id) do nothing;
  update public.invites set used_by = auth.uid(), used_at = now() where code = inv.code;
  return inv.baby_id;
end $$;

revoke all on function public.create_baby(text,date,text,text,text) from public, anon;
revoke all on function public.create_invite(uuid,text) from public, anon;
revoke all on function public.accept_invite(text,text) from public, anon;
grant execute on function public.create_baby(text,date,text,text,text) to authenticated;
grant execute on function public.create_invite(uuid,text) to authenticated;
grant execute on function public.accept_invite(text,text) to authenticated;
grant execute on function public.member_role(uuid), public.is_member(uuid), public.can_write(uuid) to authenticated;

-- ---------- access rules (row level security) ----------
alter table public.babies       enable row level security;
alter table public.baby_members enable row level security;
alter table public.invites      enable row level security;
alter table public.entries      enable row level security;

-- Babies: members read; parents edit; only the owner deletes. Created through create_baby().
drop policy if exists babies_read   on public.babies;
drop policy if exists babies_update on public.babies;
drop policy if exists babies_delete on public.babies;
create policy babies_read   on public.babies for select to authenticated using (public.is_member(id));
create policy babies_update on public.babies for update to authenticated using (public.can_write(id)) with check (public.can_write(id));
create policy babies_delete on public.babies for delete to authenticated using (public.member_role(id) = 'owner');

-- Members: everyone on a baby sees who else is on it. You can rename yourself or leave;
-- the owner can remove others. People join through accept_invite().
drop policy if exists members_read   on public.baby_members;
drop policy if exists members_rename on public.baby_members;
drop policy if exists members_remove on public.baby_members;
create policy members_read   on public.baby_members for select to authenticated using (public.is_member(baby_id));
create policy members_rename on public.baby_members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy members_remove on public.baby_members for delete to authenticated using (
  (user_id = auth.uid() and role <> 'owner')
  or (public.member_role(baby_id) = 'owner' and user_id <> auth.uid())
);
revoke update on public.baby_members from authenticated, anon;
grant  update (display_name) on public.baby_members to authenticated;

-- Invites: parents can see and cancel their baby's invites. Created through create_invite().
drop policy if exists invites_read   on public.invites;
drop policy if exists invites_delete on public.invites;
create policy invites_read   on public.invites for select to authenticated using (public.can_write(baby_id));
create policy invites_delete on public.invites for delete to authenticated using (public.can_write(baby_id));

-- Entries: members read; owners and parents add, edit and delete. Viewers only read.
drop policy if exists entries_read   on public.entries;
drop policy if exists entries_insert on public.entries;
drop policy if exists entries_update on public.entries;
drop policy if exists entries_delete on public.entries;
create policy entries_read   on public.entries for select to authenticated using (public.is_member(baby_id));
create policy entries_insert on public.entries for insert to authenticated with check (public.can_write(baby_id) and created_by = auth.uid());
create policy entries_update on public.entries for update to authenticated using (public.can_write(baby_id)) with check (public.can_write(baby_id));
create policy entries_delete on public.entries for delete to authenticated using (public.can_write(baby_id));

grant select, insert, update, delete on public.entries to authenticated;
grant select, update, delete on public.babies to authenticated;
grant select, delete on public.baby_members, public.invites to authenticated;

-- ---------- live sync ----------
do $$
begin
  begin alter publication supabase_realtime add table public.entries;      exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.babies;       exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.baby_members; exception when duplicate_object then null; end;
end $$;
