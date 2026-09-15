-- Aggregation functions for the admin Dashboard tab. Once Orders are
-- paginated (add-admin-indexes.sql), the dashboard can no longer sum the
-- in-memory order array in the browser — it needs to be computed in
-- Postgres. Both functions are plain `language sql stable` (NOT `security
-- definer`), so they run with the calling user's own privileges and are
-- naturally bound by the existing "orders admin read" RLS policy: an admin
-- session sees real aggregates, anyone else gets zero rows back, with no
-- separate permission check needed here.

create or replace function order_stats(p_from timestamptz default null, p_to timestamptz default null)
returns table (
  revenue           numeric,
  order_count       bigint,
  paid_order_count  bigint,
  status_counts     jsonb
)
language sql
stable
as $$
  with scoped as (
    select *
    from orders
    where not is_test
      and (p_from is null or created_at >= p_from)
      and (p_to is null or created_at < p_to)
  ),
  by_status as (
    select coalesce(jsonb_object_agg(status, cnt), '{}'::jsonb) as j
    from (select status, count(*) as cnt from scoped group by status) s
  )
  select
    coalesce((select sum(total) from scoped where payment_status = 'paid'), 0) as revenue,
    (select count(*) from scoped) as order_count,
    (select count(*) from scoped where payment_status = 'paid') as paid_order_count,
    (select j from by_status) as status_counts
$$;

create or replace function best_selling_products(p_from timestamptz default null, p_to timestamptz default null, p_limit int default 5)
returns table (
  product_id text,
  name       text,
  qty_sold   bigint,
  revenue    numeric
)
language sql
stable
as $$
  select
    (item->>'id')   as product_id,
    (item->>'name') as name,
    sum((item->>'qty')::int)                          as qty_sold,
    sum((item->>'price')::numeric * (item->>'qty')::int) as revenue
  from orders o, jsonb_array_elements(o.items) as item
  where o.payment_status = 'paid'
    and not o.is_test
    and (p_from is null or o.created_at >= p_from)
    and (p_to is null or o.created_at < p_to)
  group by item->>'id', item->>'name'
  order by qty_sold desc
  limit greatest(1, p_limit)
$$;
