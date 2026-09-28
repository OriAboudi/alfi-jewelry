-- "N for ₪X" bundle deal (default 3 for ₪200; size/price are admin settings
-- in content.bundleSize / content.bundlePrice).
-- products.in_bundle: the admin marks which products take part.
-- orders.bundle_discount: the amount the deal took off this order, computed
-- server-side in create-takbull-payment (orders.discount stays the coupon).
alter table products add column if not exists in_bundle boolean not null default false;
alter table orders add column if not exists bundle_discount numeric not null default 0;
