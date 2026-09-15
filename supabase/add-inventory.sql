-- Adds stock tracking to products. Existing rows get a generous default so
-- nothing on the live site suddenly looks "out of stock" — the admin can
-- then set real per-product quantities.
alter table products add column if not exists stock integer not null default 50;

-- Atomic decrement, called once per line item when a payment is confirmed
-- paid (takbull-ipn). Never goes below 0 even under concurrent requests —
-- the arithmetic happens inside a single UPDATE statement in Postgres, not
-- in application code (which would be a read-then-write race).
create or replace function decrement_stock(p_id bigint, p_qty integer)
returns void
language sql
as $$
  update products set stock = greatest(stock - p_qty, 0) where id = p_id;
$$;
