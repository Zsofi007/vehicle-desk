-- Soft-replace expiry items of same type per vehicle
-- When a new expiry item is added for the same vehicle+type, previous active ones are negated.

alter table public.expiry_items
add column if not exists is_active boolean not null default true,
add column if not exists negated_at timestamptz;

create index if not exists expiry_items_vehicle_type_active_idx
  on public.expiry_items (vehicle_id, type, is_active);

