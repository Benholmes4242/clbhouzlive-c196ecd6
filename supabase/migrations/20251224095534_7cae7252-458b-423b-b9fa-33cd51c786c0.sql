-- Fix search_path for newly created functions
CREATE OR REPLACE FUNCTION notify_admin_on_verification_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, metadata, audience, link)
  VALUES (
    'verification_request',
    'New Verification Request',
    'A new ' || TG_TABLE_NAME || ' verification request has been submitted',
    jsonb_build_object('request_id', NEW.id, 'table', TG_TABLE_NAME),
    'all',
    '/admin/verification'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION notify_admin_on_invite_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    INSERT INTO public.admin_notifications (type, title, message, metadata, audience, link)
    VALUES (
      'invite_accepted',
      'Admin Invite Accepted',
      'An admin invitation has been accepted',
      jsonb_build_object('invite_id', NEW.id, 'email', NEW.email),
      'full',
      '/admin/admins'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION check_expiring_admin_access()
RETURNS void AS $$
DECLARE
  expiring_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO expiring_count
  FROM public.admin_memberships
  WHERE expires_at IS NOT NULL
    AND expires_at > now()
    AND expires_at <= now() + interval '7 days';
    
  IF expiring_count > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.admin_notifications 
      WHERE type = 'expiring_access' 
      AND created_at > now() - interval '24 hours'
    ) THEN
      INSERT INTO public.admin_notifications (type, title, message, metadata, audience, link)
      VALUES (
        'expiring_access',
        'Admin Access Expiring Soon',
        expiring_count || ' admin membership(s) expiring within 7 days',
        jsonb_build_object('count', expiring_count),
        'full',
        '/admin/admins'
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;