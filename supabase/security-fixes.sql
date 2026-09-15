-- Run this once in the Supabase SQL Editor.
-- Closes two privilege-escalation holes and switches orders to guest checkout.

-- 1) Signup always creates a 'customer' profile; never trusts a
--    client-supplied role in the signup metadata.
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

-- 2) A signed-in user can no longer promote themselves to admin via a
--    normal profile update. Role only changes when an existing admin
--    performs the update.
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

-- 3) Guest checkout: orders are created with no owner (user_id is null).
--    Only the admin can read or update orders.
drop policy if exists "orders own insert" on orders;
drop policy if exists "orders own read" on orders;

create policy "orders guest insert"
on orders for insert
with check (user_id is null);

create policy "orders admin read"
on orders for select
using (is_admin());
