-- Adds Takbull as the site's payment gateway (a Stripe integration existed
-- briefly during development and was fully removed).
-- payment_method records which gateway an order was placed through;
-- takbull_uniq_id is Takbull's order identifier, used to match IPN callbacks
-- back to the order.

alter table orders add column if not exists payment_method text not null default 'takbull';
alter table orders alter column payment_method set default 'takbull';
alter table orders add column if not exists takbull_uniq_id text;

create index if not exists orders_takbull_uniq_id_idx on orders (takbull_uniq_id);
