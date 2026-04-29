-- Add vehicle type selector support

alter table public.vehicles
add column vehicle_type text not null default 'car_under_2t';

-- Optional: keep values constrained to known types (simple check constraint)
alter table public.vehicles
add constraint vehicles_vehicle_type_check
check (
  vehicle_type in (
    'car_under_2t',
    'minivan',
    'truck',
    'motorcycle',
    'trailer',
    'bus',
    'electric_car',
    'other'
  )
);

