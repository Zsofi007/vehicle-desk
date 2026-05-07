-- Add optional company name to profiles

alter table public.profiles
  add column if not exists company_name text;

