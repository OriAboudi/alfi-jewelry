-- Sale pricing. `price` stays the price actually charged (create-takbull-
-- payment reads it), so a product on sale has price = sale price and
-- compare_at_price = the regular price shown struck through. NULL (or not
-- higher than price) = not on sale.
alter table products add column if not exists compare_at_price numeric;
