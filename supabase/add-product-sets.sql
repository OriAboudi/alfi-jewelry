-- Product sets ("סטים"): products sharing a set_name form a set; each set's
-- special price is an admin setting (content.setPrices, { "<set name>": price }).
-- orders.set_discount: what complete sets took off this order, computed
-- server-side in create-takbull-payment (separate from bundle_discount and
-- the coupon discount).
alter table products add column if not exists set_name text;
alter table orders add column if not exists set_discount numeric not null default 0;
