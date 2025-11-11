-- Saved Dashboard Views
create table if not exists echo_admin_dashboard_views (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  name text not null,
  params jsonb not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_echo_admin_views_owner_created on echo_admin_dashboard_views(owner, created_at desc);
create index if not exists idx_echo_admin_views_owner_default on echo_admin_dashboard_views(owner, is_default) where is_default;

-- RLS
alter table echo_admin_dashboard_views enable row level security;

create policy "owner read/write"
  on echo_admin_dashboard_views
  for all
  using (auth.uid() = owner)
  with check (auth.uid() = owner);

-- RPCs
create or replace function echo_views_list()
returns setof echo_admin_dashboard_views
language sql security definer
as $$ 
  select * from echo_admin_dashboard_views 
  where owner = auth.uid() 
  order by is_default desc, created_at desc; 
$$;

create or replace function echo_views_save(
  p_name text, 
  p_params jsonb, 
  p_set_default boolean default false, 
  p_view_id uuid default null
)
returns uuid
language plpgsql security definer
as $$
declare 
  v_id uuid;
begin
  if p_view_id is null then
    insert into echo_admin_dashboard_views(owner, name, params, is_default)
    values (auth.uid(), p_name, p_params, coalesce(p_set_default, false))
    returning id into v_id;
  else
    update echo_admin_dashboard_views
       set name = p_name, params = p_params, is_default = coalesce(p_set_default, is_default)
     where id = p_view_id and owner = auth.uid()
    returning id into v_id;
  end if;

  if coalesce(p_set_default, false) then
    update echo_admin_dashboard_views
       set is_default = false
     where owner = auth.uid() and id <> v_id;
  end if;

  return v_id;
end $$;

create or replace function echo_views_delete(p_id uuid)
returns void
language sql security definer
as $$ 
  delete from echo_admin_dashboard_views 
  where id = p_id and owner = auth.uid(); 
$$;

create or replace function echo_views_get(p_id uuid)
returns jsonb
language sql security definer
as $$
  select params from echo_admin_dashboard_views 
  where id = p_id and owner = auth.uid();
$$;