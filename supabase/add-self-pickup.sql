-- Self pickup as a delivery method.
-- delivery_method: 'delivery' (home delivery, the existing flow) or 'pickup'.
-- pickup_address: snapshot of content.pickupAddress at order time, so a later
-- change to the admin setting never rewrites where past orders were collected.
-- Existing rows default to 'delivery'. Shipping stays in orders.shipping
-- (0 for pickup — computed server-side in create-takbull-payment).
alter table orders add column if not exists delivery_method text not null default 'delivery';
alter table orders add column if not exists pickup_address text;
do $$ begin
  alter table orders add constraint orders_delivery_method_check check (delivery_method in ('delivery', 'pickup'));
exception when duplicate_object then null; end $$;
