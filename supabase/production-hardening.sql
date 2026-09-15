-- Run this ONCE in the Supabase SQL Editor. Open this file directly and
-- copy from here (not from chat) to avoid paste corruption.
--
-- This replaces supabase/security-fixes.sql — it is a complete, idempotent
-- reset of every RLS policy, so it's safe to run even if earlier scripts
-- partially applied or didn't apply at all.

-- 0) URGENT: restore the real admin account (a prior test run demoted it).
update profiles set role = 'admin' where email = 'ori.escbaz@gmail.com';

-- 1) Make sure RLS is actually ON for every table.
alter table products enable row level security;
alter table collections enable row level security;
alter table content enable row level security;
alter table orders enable row level security;
alter table profiles enable row level security;

-- 2) is_admin() helper (idempotent).
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- 3) Drop every policy we know about, then recreate cleanly.
drop policy if exists "products read" on products;
drop policy if exists "products write" on products;
drop policy if exists "collections read" on collections;
drop policy if exists "collections write" on collections;
drop policy if exists "content read" on content;
drop policy if exists "content write" on content;
drop policy if exists "orders own read" on orders;
drop policy if exists "orders own insert" on orders;
drop policy if exists "orders admin write" on orders;
drop policy if exists "orders guest insert" on orders;
drop policy if exists "orders admin read" on orders;
drop policy if exists "profiles own" on profiles;
drop policy if exists "profiles admin" on profiles;

create policy "products read"
on products for select
using (true);

create policy "products write"
on products for all
using (is_admin())
with check (is_admin());

create policy "collections read"
on collections for select
using (true);

create policy "collections write"
on collections for all
using (is_admin())
with check (is_admin());

create policy "content read"
on content for select
using (true);

create policy "content write"
on content for all
using (is_admin())
with check (is_admin());

-- Guest checkout: orders always have user_id = null, anyone can insert one.
-- Only the admin can read or update orders.
create policy "orders guest insert"
on orders for insert
with check (user_id is null);

create policy "orders admin read"
on orders for select
using (is_admin());

create policy "orders admin write"
on orders for update
using (is_admin())
with check (is_admin());

create policy "profiles own"
on profiles for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "profiles admin"
on profiles for select
using (is_admin());

-- 4) Signup never trusts a client-supplied role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (new.id, new.raw_user_meta_data->>'name', new.email, 'customer')
  on conflict (id) do nothing;
  return new;
exception when others then
  return new;
end;
$$;

-- 5) A non-admin can never change their own role via a normal update.
create or replace function public.prevent_role_self_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() and new.role is distinct from old.role then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on profiles;

create trigger profiles_guard_role
before update on profiles
for each row execute function public.prevent_role_self_change();

-- 6) Storage bucket policies (idempotent).
drop policy if exists "images public read" on storage.objects;
drop policy if exists "images admin insert" on storage.objects;
drop policy if exists "images admin update" on storage.objects;
drop policy if exists "images admin delete" on storage.objects;

create policy "images public read"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "images admin insert"
on storage.objects for insert
with check (bucket_id = 'product-images' and is_admin());

create policy "images admin update"
on storage.objects for update
using (bucket_id = 'product-images' and is_admin());

create policy "images admin delete"
on storage.objects for delete
using (bucket_id = 'product-images' and is_admin());

-- 7) Verification: every row below must show rowsecurity = true.
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relname in ('products', 'collections', 'content', 'orders', 'profiles')
order by relname;
