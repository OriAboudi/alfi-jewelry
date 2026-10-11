-- Cost prices (what ALFI pays the supplier), for the admin "הזמנת מלאי" tab
-- and the product editor. Deliberately NOT a column on products: that table
-- is readable by every site visitor ("products read" using (true)), and a
-- cost column there would publish the wholesale prices. This table is
-- admin-only, read and write.
--   item_key = 'p:<product id>'  — a single product
--            = 's:<set name>'    — a set ordered as one unit
create table if not exists cost_prices (
  item_key   text primary key,
  cost       numeric not null default 0 check (cost >= 0),
  updated_at timestamptz not null default now()
);

alter table cost_prices enable row level security;

drop policy if exists "cost_prices admin" on cost_prices;
create policy "cost_prices admin" on cost_prices for all using (is_admin()) with check (is_admin());
