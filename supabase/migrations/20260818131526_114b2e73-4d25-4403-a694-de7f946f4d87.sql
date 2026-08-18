CREATE OR REPLACE FUNCTION public.request_info_business_verification(_request_id uuid, _admin_note text, _review_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_reason text := nullif(btrim(coalesce(_review_reason, '')), '');
  v_note   text := nullif(btrim(coalesce(_admin_note, '')), '');
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  -- PHASE 4: the structured reason is the required field. A free-text note is
  -- only required when the reason cannot carry the decision on its own
  -- ('other'), or when no reason was supplied at all (legacy clients).
  if v_reason is null or v_reason = 'other' then
    if v_note is null or length(v_note) < 3 then
      raise exception 'A reason is required; when the reason is "other" a note of at least 3 characters is required';
    end if;
  end if;

  update public.business_verification_requests
  set status = 'needs_more_info',
      admin_note = _admin_note,
      review_reason = v_reason,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = _request_id;

  if not found then
    raise exception 'Request not found';
  end if;
end;
$function$;