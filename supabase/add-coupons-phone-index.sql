-- Speeds up the login-by-phone Edge Function's lookup (coupons.phone was
-- previously only searched by email — see add-signup-coupons.sql).
create index if not exists coupons_phone_idx on coupons (phone);
