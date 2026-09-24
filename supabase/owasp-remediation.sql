-- OWASP Top 10 remediation. Run this ONCE in the Supabase SQL Editor, AFTER
-- production-hardening.sql and the add-*.sql files. Idempotent: safe to
-- re-run. Deploy the updated Edge Functions after this (they call
-- check_rate_limit below; they fail open if it's missing, so order of
-- deploy can't break checkout, but rate limiting only works once it exists).

-- 1) [A01 Broken Access Control] Close direct order inserts.
--    "orders guest insert" let ANY holder of the public anon key insert a
--    row straight into `orders` — including payment_status = 'paid' and an
--    arbitrary total — bypassing create-takbull-payment and Takbull
--    entirely. The admin panel would show it as a real paid order. Every
--    real order is created by create-takbull-payment with the service role
--    (which bypasses RLS), so no client-facing insert policy is needed.
drop policy if exists "orders guest insert" on orders;
drop policy if exists "orders own insert" on orders;

-- 2) [A01 Broken Access Control] Profiles privilege escalation.
--    "profiles own" was `for all`, so a signed-in user could DELETE their own
--    profile row and then INSERT a new one with role = 'admin' — the
--    prevent_role_self_change trigger only ran on UPDATE. Anyone can create
--    an account with the public anon key (supabase.auth.signUp), so this
--    was a full takeover of the admin panel. Users may now only read and
--    update their own row; insert happens only via the handle_new_user
--    trigger (security definer), and delete only via auth.users cascade.
drop policy if exists "profiles own" on profiles;
drop policy if exists "profiles own read" on profiles;
drop policy if exists "profiles own update" on profiles;

create policy "profiles own read"
on profiles for select
using (auth.uid() = id);

create policy "profiles own update"
on profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- The role guard now also runs on INSERT, and only applies to requests
-- coming through the API as anon/authenticated. Previously it also fired in
-- the SQL Editor (where auth.uid() is null, so is_admin() is false) and
-- silently reverted `update profiles set role = 'admin' ...` — the owner's
-- only legitimate way to grant admin.
create or replace function public.prevent_role_self_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') and not is_admin() then
    if tg_op = 'INSERT' then
      new.role := 'customer';
    elsif new.role is distinct from old.role then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on profiles;
create trigger profiles_guard_role
before insert or update on profiles
for each row execute function public.prevent_role_self_change();

-- 3) [A01] Least privilege on RPCs. decrement_stock is only ever called by
--    takbull-ipn (service role). It was already harmless to anon because
--    RLS on products blocked the UPDATE, but it shouldn't be exposed at all.
revoke execute on function decrement_stock(bigint, integer) from public, anon, authenticated;
grant execute on function decrement_stock(bigint, integer) to service_role;

-- 4) [A04 Insecure Design / A07] Rate limiting for public Edge Functions
--    (login-by-phone, signup-coupon, validate-coupon, create-takbull-payment).
--    Fixed-window counter keyed by an arbitrary string (e.g. "phone-login:ip:1.2.3.4").
--    Service-role only — no RLS policies, and execute revoked from clients.
create table if not exists rate_limits (
  key          text primary key,
  window_start timestamptz not null default now(),
  count        integer not null default 0
);
alter table rate_limits enable row level security;
-- Intentionally no policies — anon/authenticated get zero direct access.

create or replace function check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into rate_limits as r (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
    set count = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.count + 1 end,
        window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning count into v_count;

  -- Opportunistic cleanup so the table doesn't grow without bound.
  if random() < 0.01 then
    delete from rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_count <= p_limit;
end;
$$;

revoke execute on function check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function check_rate_limit(text, integer, integer) to service_role;

-- 5) One sign-up coupon per person, ever (by email OR phone). signup-coupon
--    checks this before inserting; these unique indexes close the race where
--    two simultaneous sign-ups both pass that check. Created only if the
--    table has no existing duplicates — otherwise a NOTICE lists what to
--    clean up (void/delete the extras, then re-run this file).
do $$
begin
  if exists (select 1 from coupons group by lower(email) having count(*) > 1) then
    raise notice 'coupons has duplicate emails — unique index NOT created. Find them with: select lower(email), count(*) from coupons group by 1 having count(*) > 1;';
  else
    create unique index if not exists coupons_email_unique on coupons (lower(email));
  end if;

  if exists (select 1 from coupons where phone is not null group by phone having count(*) > 1) then
    raise notice 'coupons has duplicate phones — unique index NOT created. Find them with: select phone, count(*) from coupons where phone is not null group by 1 having count(*) > 1;';
  else
    create unique index if not exists coupons_phone_unique on coupons (phone) where phone is not null;
  end if;
end $$;

-- 6) [A04/A09] Surface payment anomalies in the admin panel. takbull-ipn
--    sets this when an order must NOT be shipped as-is (the amount Takbull
--    captured is below the order total, or the order used a one-time coupon
--    that another order had already redeemed). The Orders tab shows it as a
--    warning badge; the full gateway payload stays in `transactions`.
alter table orders add column if not exists review_flag text;

-- 7) [A05/A08] Supabase security-advisor findings (supabase db advisors).
--    a) Pin search_path on functions that didn't set one, so a caller can't
--       shadow `products`/`orders` with objects in another schema.
alter function decrement_stock(bigint, integer) set search_path = public;
alter function order_stats(timestamptz, timestamptz) set search_path = public;
alter function best_selling_products(timestamptz, timestamptz, int) set search_path = public;
--    b) Trigger-only functions don't need to be callable over the REST API
--       (/rest/v1/rpc/...). Triggers still fire — EXECUTE is only checked
--       for direct calls.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.prevent_role_self_change() from public, anon, authenticated;
--    is_admin() intentionally stays executable by anon/authenticated: every
--    RLS policy calls it as the requesting role, so revoking it would break
--    all reads/writes. It only reveals whether the CALLER is an admin.

-- 8) Verification.
select policyname, cmd from pg_policies where tablename in ('orders', 'profiles') order by tablename, policyname;
