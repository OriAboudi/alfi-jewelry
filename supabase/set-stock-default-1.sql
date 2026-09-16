-- The products.stock column defaulted to 50 (add-inventory.sql), matching
-- the admin product editor's old default. The editor now defaults new
-- products to 1 instead (a safer "specify what you actually have" default
-- for handmade, low-volume pieces) -- this brings the DB column default in
-- line with it, in case a row is ever inserted without stock specified.
alter table products alter column stock set default 1;
