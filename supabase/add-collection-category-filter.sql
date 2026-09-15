-- Lets a collection map to a real product category, so clicking a
-- collection on the storefront actually filters the catalog instead of
-- always linking to the full, unfiltered product list.
alter table collections add column if not exists category_filter text;
