-- =====================================================================
-- Nestling: Ask Nestling (AI answers) — daily limits and answer reports
-- Run once in Supabase: SQL Editor → New query → paste → Run. Safe to run again.
-- Also included at the end of schema.sql.
-- =====================================================================

create table if not exists public.ask_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null default current_date,
  count   int  not null default 0,
  primary key (user_id, day)
);
alter table public.ask_usage enable row level security;
drop policy if exists ask_usage_read on public.ask_usage;
create policy ask_usage_read on public.ask_usage for select to authenticated using (user_id = auth.uid());
grant select on public.ask_usage to authenticated;

-- Uses one question for the signed-in person and returns how many are left today.
create or replace function public.ask_take_quota(p_limit int) returns int
language plpgsql security definer set search_path = public as $$
declare used int;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  insert into public.ask_usage (user_id, day, count) values (auth.uid(), current_date, 1)
  on conflict (user_id, day) do update set count = public.ask_usage.count + 1
  returning count into used;
  if used > p_limit then
    update public.ask_usage set count = p_limit where user_id = auth.uid() and day = current_date;
    raise exception 'Daily question limit reached';
  end if;
  return p_limit - used;
end $$;
revoke all on function public.ask_take_quota(int) from public, anon;
grant execute on function public.ask_take_quota(int) to authenticated;

-- Reports on AI answers (Google Play requires in-app reporting of AI content).
-- Parents can add reports; only you can read them (Table Editor → ask_reports).
create table if not exists public.ask_reports (
  id         bigint generated always as identity primary key,
  user_id    uuid default auth.uid() references auth.users(id) on delete set null,
  baby_id    uuid references public.babies(id) on delete set null,
  question   text,
  answer     text,
  reason     text check (reason in ('unsafe','unhelpful','offensive')),
  created_at timestamptz not null default now()
);
alter table public.ask_reports enable row level security;
drop policy if exists ask_reports_insert on public.ask_reports;
create policy ask_reports_insert on public.ask_reports for insert to authenticated
  with check (user_id = auth.uid() and (baby_id is null or public.is_member(baby_id)));
grant insert on public.ask_reports to authenticated;
