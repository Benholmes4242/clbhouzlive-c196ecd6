-- D1: Widen notifications.type CHECK to include the full whitelist + business_verification_needs_info
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN (
  'like','comment','follow','mention','tag','message',
  'friend_request','friend_accepted','friend_accept','friend_course_review',
  'game_invite','game_update','achievement','business_member_added',
  'business_verification_submitted','business_verification_requested',
  'business_verification_approved','business_verification_rejected',
  'business_verification_revoked','business_verification_needs_info',
  'personal_verification_submitted','personal_verification_requested',
  'personal_verification_approved','personal_verification_rejected'
));

-- D2: Extend trigger to handle needs_more_info
CREATE OR REPLACE FUNCTION public.notify_verification_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _title text; _body text; _type text; _audit_reason text; _business_name text; _business_logo text; _audit_action text;
BEGIN
  IF old.status = new.status THEN RETURN new; END IF;
  SELECT name, logo_url INTO _business_name, _business_logo FROM public.business_accounts WHERE id = new.business_id;
  IF new.status = 'approved' THEN
    _title := 'You''re verified'; _body := 'Your business profile has been successfully verified.';
    _type := 'business_verification_approved'; _audit_reason := 'Business verification approved.'; _audit_action := 'approved';
  ELSIF new.status = 'rejected' THEN
    _title := 'Verification not approved'; _body := coalesce(new.admin_note, 'We couldn''t verify your business at this time. You can update details and request again.');
    _type := 'business_verification_rejected'; _audit_reason := 'Business verification rejected.'; _audit_action := 'rejected';
  ELSIF new.status = 'needs_more_info' THEN
    _title := 'More info needed'; _body := coalesce(new.admin_note, 'We need a bit more to verify your business. Tap to see what''s required and resubmit.');
    _type := 'business_verification_needs_info'; _audit_reason := 'Business verification needs more info.'; _audit_action := 'needs_more_info';
  ELSE RETURN new; END IF;
  INSERT INTO public.notifications (user_id, type, title, message, entity_type, entity_id, recipient_actor_id, data)
  VALUES (new.requested_by, _type, _title, _body, 'business_verification_request', new.id, new.requested_by,
    jsonb_build_object('business_id', new.business_id, 'status', new.status, 'admin_note', new.admin_note, 'entity_name', _business_name, 'entity_avatar_url', _business_logo))
  ON CONFLICT (user_id, type, actor_id, entity_id) DO NOTHING;
  INSERT INTO public.verification_audit_log (entity_type, entity_id, action, performed_by, reason, metadata)
  VALUES ('business', new.business_id, _audit_action,
    new.reviewed_by, _audit_reason, jsonb_build_object('request_id', new.id, 'admin_note', new.admin_note));
  RETURN new;
END; $function$;