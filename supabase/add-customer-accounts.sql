-- Customer accounts: order history that follows the customer to every device.
-- Run ONCE in the Supabase SQL Editor (after owasp-remediation.sql).
-- Idempotent and purely additive: no table, column or RLS policy changes, and
-- no existing order is modified except by a signed-in customer linking an
-- order whose id they already hold (see claim_orders).
--
-- Why RPCs instead of an "orders own read" RLS policy: a SELECT policy would
-- let the customer read every column of their rows (gateway ids, review
-- flags, …). These functions return only display-safe fields, and only ever
-- for auth.uid().

-- 1) The signed-in customer's own orders, newest first.
create or replace function public.my_orders()
returns table (
  id uuid,
  number text,
  created_at timestamptz,
  status text,
  payment_status text,
  total numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select o.id, o.number, o.created_at, o.status, o.payment_status, o.total
  from orders o
  where auth.uid() is not null
    and o.user_id = auth.uid()
    and not coalesce(o.is_test, false)
  order by o.created_at desc
  limit 200;
$$;

-- 2) Link guest orders to the signed-in account. The caller passes order
--    UUIDs this browser placed (or opened via the emailed tracking link) —
--    the same unguessable bearer capability get-order already accepts, so
--    this grants no access the caller didn't have. Only orders with no
--    owner are touched: an order never moves from one account to another.
--    Orders are NOT matched by email: sign-up has no email verification
--    (mailer_autoconfirm), so an email match would let anyone register
--    with someone else's address and see their orders.
create or replace function public.claim_orders(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then
    return 0;
  end if;
  if p_ids is null or array_length(p_ids, 1) is null then
    return 0;
  end if;
  if array_length(p_ids, 1) > 50 then
    raise exception 'too many ids';
  end if;

  update orders
     set user_id = auth.uid()
   where id = any(p_ids)
     and user_id is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Signed-in customers only (anon gets nothing).
revoke execute on function public.my_orders() from public, anon;
revoke execute on function public.claim_orders(uuid[]) from public, anon;
grant execute on function public.my_orders() to authenticated;
grant execute on function public.claim_orders(uuid[]) to authenticated;

-- Fast "my orders" lookups.
create index if not exists orders_user_id_idx on orders (user_id) where user_id is not null;

-- Verification: both functions exist and are callable by `authenticated` only.
select p.proname, has_function_privilege('anon', p.oid, 'execute') as anon_can, has_function_privilege('authenticated', p.oid, 'execute') as authed_can
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('my_orders', 'claim_orders');
