CREATE OR REPLACE FUNCTION public.request_info_business_verification(_request_id uuid, _admin_note text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  if _admin_note is null or length(btrim(_admin_note)) < 3 then
    raise exception 'admin_note required (min 3 characters)';
  end if;

  update public.business_verification_requests
  set status = 'needs_more_info',
      admin_note = _admin_note,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = _request_id;

  if not found then
    raise exception 'Request not found';
  end if;
end;
$function$;

GRANT EXECUTE ON FUNCTION public.request_info_business_verification(uuid, text) TO authenticated, service_role;