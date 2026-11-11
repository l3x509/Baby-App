-- =====================================================================
-- Bebenou: Premium (one subscription covers the whole family log)
--          and entry photos (private Supabase Storage bucket)
-- Run once in Supabase: SQL Editor → New query → paste → Run. Safe to run again.
-- Also included at the end of schema.sql.
-- =====================================================================

-- 1) Premium status lives on the baby's log, so every family member gets it
--    when anyone in the family subscribes.
alter table public.babies add column if not exists premium_until timestamptz;
alter table public.babies add column if not exists premium_by    uuid references auth.users(id) on delete set null;

-- Parents can edit the baby's profile, but only the server (the "premium"
-- Edge Function, which checks RevenueCat) can change premium fields.
create or replace function public.babies_lock_premium() returns trigger
language plpgsql as $$
begin
  -- Only the server (service role) or you in the SQL editor may change these.
  if current_user not in ('postgres','service_role','supabase_admin') and coalesce(auth.role(),'') <> 'service_role' then
    new.premium_until := old.premium_until;
    new.premium_by    := old.premium_by;
  end if;
  return new;
end $$;
drop trigger if exists babies_lock_premium on public.babies;
create trigger babies_lock_premium before update on public.babies
  for each row execute function public.babies_lock_premium();

-- New logs never start with premium set by the client.
create or replace function public.babies_clear_premium() returns trigger
language plpgsql as $$
begin
  if current_user not in ('postgres','service_role','supabase_admin') and coalesce(auth.role(),'') <> 'service_role' then
    new.premium_until := null; new.premium_by := null;
  end if;
  return new;
end $$;
drop trigger if exists babies_clear_premium on public.babies;
create trigger babies_clear_premium before insert on public.babies
  for each row execute function public.babies_clear_premium();

-- 2) Photos: private bucket. Files are stored as <baby_id>/<entry_id>/<file>.jpg
--    and only members of that baby's log can see them; writers can add/remove.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 3145728,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists photos_read   on storage.objects;
drop policy if exists photos_insert on storage.objects;
drop policy if exists photos_delete on storage.objects;

create policy photos_read on storage.objects for select to authenticated
  using (bucket_id = 'photos' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.can_write(((storage.foldername(name))[1])::uuid));
create policy photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.can_write(((storage.foldername(name))[1])::uuid));
