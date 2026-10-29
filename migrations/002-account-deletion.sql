-- =====================================================================
-- Nestling: account deletion (required by Google Play)
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- Safe to run again. Also included at the end of schema.sql.
-- =====================================================================

-- A baby's log no longer depends on the account that created it.
alter table public.babies alter column created_by drop not null;
alter table public.babies drop constraint if exists babies_created_by_fkey;
alter table public.babies add constraint babies_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

-- Delete the signed-in person's account.
-- • A log they own that someone else also uses is handed to that person (a parent first).
-- • A log nobody else uses is deleted with all its entries.
-- • Entries they added to a log that stays are kept for the family, without their name.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare
  me uuid := auth.uid();
  b record;
  heir uuid;
begin
  if me is null then raise exception 'Sign in first'; end if;
  for b in select baby_id from public.baby_members where user_id = me and role = 'owner' loop
    heir := null;
    select user_id into heir from public.baby_members
      where baby_id = b.baby_id and user_id <> me
      order by (role = 'parent') desc, joined_at
      limit 1;
    if heir is null then
      delete from public.babies where id = b.baby_id;
    else
      update public.baby_members set role = 'owner' where baby_id = b.baby_id and user_id = heir;
    end if;
  end loop;
  delete from auth.users where id = me;
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
