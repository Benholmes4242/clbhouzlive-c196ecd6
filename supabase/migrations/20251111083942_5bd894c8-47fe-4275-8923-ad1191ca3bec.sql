-- Analytics events table
create table if not exists analytics_events (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  user_id       uuid,
  name          text not null,
  props         jsonb not null default '{}',
  ip            inet,
  ua            text
);

-- RLS policies
alter table analytics_events enable row level security;

-- Policy: allow inserts from authenticated users
create policy ae_insert_auth on analytics_events
  for insert to authenticated
  with check (true);

-- Policy: read only for admins (using existing is_admin function)
create policy ae_read_admin on analytics_events
  for select to authenticated
  using (exists (select 1 from is_admin() where is_admin = true));

-- Indexes
create index if not exists ae_name_time_idx on analytics_events (name, created_at);
create index if not exists ae_created_at_idx on analytics_events (created_at);
create index if not exists ae_props_tag_idx on analytics_events ((props->>'tag'));
create index if not exists ae_props_user_idx on analytics_events ((props->>'user_id'));

-- RPC: Overview counters
create or replace function echo_stats_overview(p_from timestamptz, p_to timestamptz)
returns table (
  events_count bigint,
  unique_users bigint,
  shares_created bigint,
  exports bigint
) language sql stable security definer as $$
  select
    count(*)::bigint as events_count,
    count(distinct coalesce(user_id::text, props->>'user_id'))::bigint as unique_users,
    sum(case when name = 'echo_share_created' then 1 else 0 end)::bigint as shares_created,
    sum(case when name in ('echo_history_export_started','echo_history_export_bulk_started') then 1 else 0 end)::bigint as exports
  from analytics_events
  where created_at >= p_from and created_at < p_to
    and name like 'echo_%';
$$;

-- RPC: Timeseries (daily)
create or replace function echo_stats_timeseries(p_from timestamptz, p_to timestamptz)
returns table (day date, events bigint) language sql stable security definer as $$
  with days as (
    select generate_series(date_trunc('day', p_from), date_trunc('day', p_to - interval '1 day'), interval '1 day')::date as d
  )
  select d as day, coalesce(count(ae.*),0)::bigint as events
  from days
  left join analytics_events ae
    on date_trunc('day', ae.created_at) = d
   and ae.created_at >= p_from and ae.created_at < p_to
   and ae.name like 'echo_%'
  group by d
  order by d;
$$;

-- RPC: Top tags
create or replace function echo_stats_top_tags(p_from timestamptz, p_to timestamptz, p_limit int default 10)
returns table (tag text, uses bigint) language sql stable security definer as $$
  select t.name as tag, count(*)::bigint as uses
  from echo_thread_tags tt
  join echo_tags t on t.id = tt.tag_id
  join echo_threads et on et.id = tt.thread_id
  where et.updated_at >= p_from and et.updated_at < p_to
  group by t.name
  order by uses desc
  limit greatest(p_limit, 1);
$$;

-- RPC: User activity (top active users by events)
create or replace function echo_stats_top_users(p_from timestamptz, p_to timestamptz, p_limit int default 10)
returns table (user_id text, events bigint) language sql stable security definer as $$
  select coalesce(ae.user_id::text, ae.props->>'user_id') as user_id,
         count(*)::bigint as events
  from analytics_events ae
  where ae.created_at >= p_from and ae.created_at < p_to
    and ae.name like 'echo_%'
  group by 1
  order by events desc
  limit greatest(p_limit, 1);
$$;

-- RPC: Exports breakdown
create or replace function echo_stats_exports(p_from timestamptz, p_to timestamptz)
returns table (kind text, total bigint) language sql stable security definer as $$
  select
    case
      when name = 'echo_history_export_bulk_started' then 'bulk'
      when name = 'echo_history_export_started' then 'single'
      else 'other'
    end as kind,
    count(*)::bigint
  from analytics_events
  where created_at >= p_from and created_at < p_to
    and name in ('echo_history_export_started','echo_history_export_bulk_started')
  group by 1
  order by 2 desc;
$$;