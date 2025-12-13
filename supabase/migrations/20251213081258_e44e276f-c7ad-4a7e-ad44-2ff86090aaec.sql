-- Update notification triggers to include business entity metadata for proper rendering

-- On request submission (pending) - include business avatar/name in notification
create or replace function public.notify_verification_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _business_name text;
  _business_logo text;
begin
  select name, logo_url into _business_name, _business_logo
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
    jsonb_build_object(
      'business_id', new.business_id, 
      'status', 'pending',
      'entity_name', _business_name,
      'entity_avatar_url', _business_logo
    )
  );

  return new;
end;
$$;

-- On status change (approved/rejected) - include business avatar/name in notification
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
  _business_logo text;
begin
  if old.status = new.status then
    return new;
  end if;

  select name, logo_url into _business_name, _business_logo
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
    jsonb_build_object(
      'business_id', new.business_id, 
      'status', new.status, 
      'admin_note', new.admin_note,
      'entity_name', _business_name,
      'entity_avatar_url', _business_logo
    )
  );

  return new;
end;
$$;