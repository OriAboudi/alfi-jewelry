-- Per-product text for the "פרטי המוצר" accordion on the product page.
-- Empty = the product page falls back to "<material>. כל תכשיט עשוי להיות
-- שונה במעט מהתמונה בשל תהליך הייצור."
alter table products add column if not exists details text not null default '';
