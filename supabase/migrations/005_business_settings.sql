-- ==============================================================================
-- 005_business_settings.sql
-- Gayatri Store Wholesale Platform: Controlled Business Settings
-- ==============================================================================

create table if not exists public.business_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_business_settings_updated_at on public.business_settings;
create trigger set_business_settings_updated_at
  before update on public.business_settings
  for each row execute function public.handle_updated_at();

-- Seed initial Gayatri Store operational and public settings
insert into public.business_settings (key, value, is_public)
values
  ('contact_info', '{
    "business_name": "Gayatri Store",
    "tagline": "Har Dukaan Tak, Bharosemand Supply.",
    "contact_phone": "+918849263377",
    "whatsapp_number": "918849263377",
    "contact_email": "supply@gayatristore.in",
    "business_address": "Maya Bazar Main Road, Near Wholesale Market, India",
    "business_hours": "Mon - Sat: 8:00 AM - 8:30 PM (Sun: Half Day)",
    "delivery_coverage": "Maya Bazar central godown and surrounding 50+ km trade zone"
  }'::jsonb, true),
  ('ordering_policy', '{
    "minimum_order_value": 3000,
    "payment_terms": "Advance bank transfer, cash on godown pickup, or verified UPI",
    "freight_terms": "Direct godown dispatch; transport bilty charges as per actuals",
    "return_policy": "Damaged lots or dispatch defects must be reported within 24 hours of receipt"
  }'::jsonb, true)
on conflict (key) do update set
  value = excluded.value,
  is_public = excluded.is_public,
  updated_at = now();
