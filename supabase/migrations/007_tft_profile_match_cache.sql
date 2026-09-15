begin;
create table if not exists public.tft_profile_match_cache (
  match_id text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists idx_tft_profile_match_cache_expires_at
  on public.tft_profile_match_cache(expires_at);
alter table public.tft_profile_match_cache enable row level security;
revoke all on public.tft_profile_match_cache from anon, authenticated;
grant select, insert, update, delete on public.tft_profile_match_cache to service_role;
commit;
