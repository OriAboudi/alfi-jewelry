-- Lets the admin hide a collection from the storefront without deleting it.
-- Hidden collections still show (marked) in the admin Collections tab.
alter table collections add column if not exists hidden boolean not null default false;
