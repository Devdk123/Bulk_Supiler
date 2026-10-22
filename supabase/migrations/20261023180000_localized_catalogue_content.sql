-- Optional Hindi display text. Original product and brand names remain unchanged.
-- This migration is additive and does not modify existing data or RLS policies.
alter table public.products
  add column if not exists short_description_hi text,
  add column if not exists description_hi text;

alter table public.categories
  add column if not exists name_hi text,
  add column if not exists description_hi text;

comment on column public.products.short_description_hi is
  'Optional Hindi short display description. Falls back to the English short description when null.';
comment on column public.products.description_hi is
  'Optional Hindi product description. Official product and printed package names remain unchanged.';
comment on column public.categories.name_hi is
  'Optional Hindi category label. The original category name remains the stable identifier.';
comment on column public.categories.description_hi is
  'Optional Hindi category description.';
