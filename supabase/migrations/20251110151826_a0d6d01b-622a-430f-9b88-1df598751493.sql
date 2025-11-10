-- Phase 3C: Pagination, Bulk Ops, Invite Flow, Dashboard (Fixed)

-- 1) Paged users query
create or replace function public.get_users_paged(
  q text default null,
  p_limit int default 25,
  p_offset int default 0
)
returns table(
  id uuid,
  email text,
  display_name text,
  username text,
  home_club text,
  role text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  total_count bigint
)
language sql
stable
security definer
as $$
  with base as (
    select
      u.id,
      u.email,
      p.display_name,
      p.username,
      p.home_club,
      ur.role,
      u.created_at,
      u.last_sign_in_at
    from auth.users u
      left join public.user_profiles p on p.id = u.id
      left join public.user_roles ur on ur.user_id = u.id
    where
      q is null
      or u.email ilike '%'||q||'%'
      or p.username ilike '%'||q||'%'
      or p.display_name ilike '%'||q||'%'
      or u.id::text ilike '%'||q||'%'
  )
  select 
    base.*,
    (select count(*) from base) as total_count
  from base
  order by coalesce(last_sign_in_at, created_at) desc
  limit p_limit offset p_offset;
$$;

-- 2) Add missing columns to admin_invitations if they don't exist
do $$
begin
  if not exists (select 1 from information_schema.columns 
                 where table_schema = 'public' 
                 and table_name = 'admin_invitations' 
                 and column_name = 'role') then
    alter table public.admin_invitations add column role text check (role in ('limited','full'));
  end if;
  
  if not exists (select 1 from information_schema.columns 
                 where table_schema = 'public' 
                 and table_name = 'admin_invitations' 
                 and column_name = 'notes') then
    alter table public.admin_invitations add column notes text;
  end if;
  
  if not exists (select 1 from information_schema.columns 
                 where table_schema = 'public' 
                 and table_name = 'admin_invitations' 
                 and column_name = 'accepted_at') then
    alter table public.admin_invitations add column accepted_at timestamptz;
  end if;
  
  if not exists (select 1 from information_schema.columns 
                 where table_schema = 'public' 
                 and table_name = 'admin_invitations' 
                 and column_name = 'updated_at') then
    alter table public.admin_invitations add column updated_at timestamptz not null default now();
  end if;
end $$;

-- 3) Admin overview metrics
create or replace function public.admin_overview_metrics()
returns table (
  total_users bigint,
  active_7d bigint,
  panel_full_admins bigint,
  panel_limited_admins bigint,
  invites_pending bigint,
  expiring_7d bigint
)
language sql
stable
security definer
as $$
  select
    (select count(*) from auth.users) as total_users,
    (select count(*) from auth.users where last_sign_in_at > now() - interval '7 days') as active_7d,
    (select count(*) from admin_memberships where role='full' and (expires_at is null or expires_at > now())) as panel_full_admins,
    (select count(*) from admin_memberships where role='limited' and (expires_at is null or expires_at > now())) as panel_limited_admins,
    (select count(*) from admin_invitations where accepted_at is null and expires_at > now()) as invites_pending,
    (select count(*) from admin_memberships where expires_at between now() and now() + interval '7 days') as expiring_7d;
$$;

-- 4) Update trigger for admin_invitations
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'admin_invitations_updated_at') then
    create trigger admin_invitations_updated_at
      before update on admin_invitations
      for each row
      execute function update_updated_at_column();
  end if;
end $$;

-- 5) Indexes for faster lookups
create index if not exists idx_admin_invitations_token on admin_invitations(token);
create index if not exists idx_admin_invitations_email on admin_invitations(email);
create index if not exists idx_admin_invitations_expires_at on admin_invitations(expires_at) where accepted_at is null;