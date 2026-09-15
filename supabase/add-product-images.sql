-- Adds gallery support (up to 5 images) to products.
-- The existing "image" column stays as the cover photo used in listings/cart;
-- "images" holds the full gallery shown on the product page.
alter table products add column if not exists images text[] not null default '{}';
