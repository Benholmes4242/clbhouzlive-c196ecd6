-- Ensure updated_at trigger exists for admin_memberships
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin 
  new.updated_at = now(); 
  return new; 
end;
$$;

drop trigger if exists admin_memberships_set_updated_at on admin_memberships;
create trigger admin_memberships_set_updated_at
  before update on admin_memberships
  for each row execute function set_updated_at();