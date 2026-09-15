-- Indexes needed once the admin panel searches/filters/paginates orders and
-- products server-side instead of loading every row into the browser.

create index if not exists products_stock_idx on products (stock);
create index if not exists orders_status_idx on orders (status);
create index if not exists orders_payment_status_idx on orders (payment_status);
create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_number_idx on orders (number);
