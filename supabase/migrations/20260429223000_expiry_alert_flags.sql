-- Expiry alert flags (email notifications)

alter table public.expiry_items
add column if not exists notified_14d boolean not null default false,
add column if not exists notified_1d boolean not null default false;

create index if not exists expiry_items_notified_14d_idx on public.expiry_items (notified_14d);
create index if not exists expiry_items_notified_1d_idx on public.expiry_items (notified_1d);

