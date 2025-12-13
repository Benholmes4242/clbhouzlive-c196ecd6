-- =====================================================
-- BUSINESS VERIFICATION SYSTEM - FULL IMPLEMENTATION
-- =====================================================

-- 1) Create business_verification_requests table
create table if not exists public.business_verification_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_accounts(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,

  status text not null default 'pending'
    check (status in ('pending','approved','rejected','cancelled')),

  website text,
  note text,
  admin_note text,

  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enforce only one pending request per business
create unique index if not exists uniq_verif_pending_per_business
on public.business_verification_requests (business_id)
where status = 'pending';

-- 2) Add verified fields to business_accounts (if not exist)
alter table public.business_accounts
add column if not exists verified_at timestamptz,
add column if not exists verified_by uuid references auth.users(id);

-- 3) Updated-at trigger for requests
create or replace function public.set_verification_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_bvr_updated_at on public.business_verification_requests;
create trigger trg_bvr_updated_at
before update on public.business_verification_requests
for each row execute function public.set_verification_updated_at();

-- 4) Helper function: can_manage_business (uses existing business_members)
create or replace function public.can_manage_business(_business_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = _business_id
      and bm.user_profile_id = auth.uid()
      and bm.role in ('owner','admin')
  );
$$;

-- 5) Enable RLS
alter table public.business_verification_requests enable row level security;

-- 6) RLS Policies for business_verification_requests

-- Owners can SELECT their own business requests
drop policy if exists bvr_select_owner on public.business_verification_requests;
create policy bvr_select_owner
on public.business_verification_requests
for select
to authenticated
using (public.can_manage_business(business_id));

-- Owners can INSERT a request for their business
drop policy if exists bvr_insert_owner on public.business_verification_requests;
create policy bvr_insert_owner
on public.business_verification_requests
for insert
to authenticated
with check (
  public.can_manage_business(business_id)
  and requested_by = auth.uid()
  and status = 'pending'
);

-- Owners can UPDATE only their draft fields (trigger guards protected fields)
drop policy if exists bvr_update_owner on public.business_verification_requests;
create policy bvr_update_owner
on public.business_verification_requests
for update
to authenticated
using (public.can_manage_business(business_id))
with check (public.can_manage_business(business_id));

-- Admin policies (full access)
drop policy if exists bvr_select_admin on public.business_verification_requests;
create policy bvr_select_admin
on public.business_verification_requests
for select
to authenticated
using (public.is_admin());

drop policy if exists bvr_update_admin on public.business_verification_requests;
create policy bvr_update_admin
on public.business_verification_requests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists bvr_delete_admin on public.business_verification_requests;
create policy bvr_delete_admin
on public.business_verification_requests
for delete
to authenticated
using (public.is_admin());

-- 7) Trigger to prevent owners changing protected fields
create or replace function public.prevent_owner_verification_field_changes()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  _is_admin boolean;
begin
  _is_admin := public.is_admin();

  -- If admin, allow everything
  if _is_admin then
    return new;
  end if;

  -- Non-admin: only allow updates while pending
  if old.status <> 'pending' then
    raise exception 'Cannot modify verification request unless pending';
  end if;

  -- Block changes to protected fields
  if new.status <> old.status then
    raise exception 'Not allowed to change status';
  end if;

  if new.reviewed_by is distinct from old.reviewed_by
     or new.reviewed_at is distinct from old.reviewed_at
     or new.admin_note is distinct from old.admin_note then
    raise exception 'Not allowed to change review fields';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_bvr_owner_guard on public.business_verification_requests;
create trigger trg_bvr_owner_guard
before update on public.business_verification_requests
for each row execute function public.prevent_owner_verification_field_changes();

-- 8) Admin approve function (atomic)
create or replace function public.approve_business_verification(_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _business_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  select business_id into _business_id
  from public.business_verification_requests
  where id = _request_id;

  if _business_id is null then
    raise exception 'Request not found';
  end if;

  update public.business_verification_requests
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = _request_id;

  update public.business_accounts
  set is_verified = true,
      verified_at = now(),
      verified_by = auth.uid()
  where id = _business_id;
end;
$$;

-- 9) Admin reject function
create or replace function public.reject_business_verification(_request_id uuid, _admin_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.business_verification_requests
  set status = 'rejected',
      admin_note = _admin_note,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = _request_id;
end;
$$;

-- 10) Notification triggers for verification events

-- On request submission (pending)
create or replace function public.notify_verification_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _business_name text;
begin
  select name into _business_name
  from public.business_accounts
  where id = new.business_id;

  insert into public.notifications (
    user_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    data
  ) values (
    new.requested_by,
    'business_verification_submitted',
    'Verification request submitted',
    'We''ve received your request for ' || coalesce(_business_name, 'your business') || '. You can continue using clbhouz while we review it.',
    'business_verification_request',
    new.id,
    jsonb_build_object('business_id', new.business_id, 'status', 'pending')
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_verification_submitted on public.business_verification_requests;
create trigger trg_notify_verification_submitted
after insert on public.business_verification_requests
for each row execute function public.notify_verification_submitted();

-- On status change (approved/rejected)
create or replace function public.notify_verification_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _title text;
  _body text;
  _type text;
  _business_name text;
begin
  if old.status = new.status then
    return new;
  end if;

  select name into _business_name
  from public.business_accounts
  where id = new.business_id;

  if new.status = 'approved' then
    _title := 'Your business is verified';
    _body  := coalesce(_business_name, 'Your business') || ' now shows a verified badge so golfers know it''s authentic.';
    _type  := 'business_verification_approved';
  elsif new.status = 'rejected' then
    _title := 'Verification not approved';
    _body  := coalesce(new.admin_note, 'We couldn''t verify ' || coalesce(_business_name, 'your business') || ' at this time. You can update details and request again.');
    _type  := 'business_verification_rejected';
  else
    return new;
  end if;

  insert into public.notifications (
    user_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    data
  ) values (
    new.requested_by,
    _type,
    _title,
    _body,
    'business_verification_request',
    new.id,
    jsonb_build_object('business_id', new.business_id, 'status', new.status, 'admin_note', new.admin_note)
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_verification_status_change on public.business_verification_requests;
create trigger trg_notify_verification_status_change
after update on public.business_verification_requests
for each row execute function public.notify_verification_status_change();