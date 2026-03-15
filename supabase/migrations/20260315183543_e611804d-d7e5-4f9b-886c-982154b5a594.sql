create table if not exists public.web_vitals (
  id uuid primary key default gen_random_uuid(),
  metric_name text not null,
  value numeric not null,
  rating text,
  path text,
  recorded_at timestamptz default now()
);

-- No RLS needed — insert-only from Edge Function using service role key
alter table public.web_vitals enable row level security;