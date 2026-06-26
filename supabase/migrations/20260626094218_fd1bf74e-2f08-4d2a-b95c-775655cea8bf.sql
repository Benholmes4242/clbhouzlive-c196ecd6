CREATE OR REPLACE FUNCTION public.notify_course_claim_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _title text; _body text; _type text; _club_name text; _club_logo text;
BEGIN
  IF old.status = new.status THEN RETURN new; END IF;

  SELECT name, logo_url INTO _club_name, _club_logo
  FROM public.business_accounts WHERE id = new.business_id;

  IF new.status = 'approved' THEN
    _title := 'Course claim approved';
    _body  := coalesce(_club_name,'Your business') || ' now manages this golf club on clbhouz.';
    _type  := 'course_claim_approved';
  ELSIF new.status = 'rejected' THEN
    _title := 'Course claim not approved';
    _body  := coalesce(new.admin_note, 'Your course claim wasn''t approved. You can review the details and try again.');
    _type  := 'course_claim_rejected';
  ELSIF new.status = 'needs_more_info' THEN
    _title := 'More info needed';
    _body  := coalesce(new.admin_note, 'We need a bit more to approve your course claim. Tap to add detail and resubmit.');
    _type  := 'course_claim_needs_info';
  ELSE
    RETURN new;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, entity_type, entity_id, recipient_actor_id, data)
  VALUES (new.requested_by, _type, _title, _body, 'course_claim_request', new.id, new.requested_by,
    jsonb_build_object(
      'business_id', new.business_id,
      'club_id', new.club_id,
      'source_course_id', new.source_course_id,
      'status', new.status,
      'admin_note', new.admin_note,
      'entity_name', _club_name,
      'entity_avatar_url', _club_logo
    ))
  ON CONFLICT (user_id, type, actor_id, entity_id) DO NOTHING;

  RETURN new;
END; $function$;

UPDATE public.notifications
SET message = replace(message, 'on Clbhouz.', 'on clbhouz.')
WHERE type = 'course_claim_approved' AND message LIKE '%on Clbhouz.%';