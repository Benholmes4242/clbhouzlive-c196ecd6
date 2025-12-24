-- Create unified admin audit feed view
CREATE OR REPLACE VIEW public.admin_audit_feed AS
SELECT 
  id::text as id,
  'audit_log' as source,
  admin_user_id as actor_id,
  action,
  target_user_id,
  target_email,
  details,
  ip_address,
  user_agent,
  created_at,
  CASE 
    WHEN details IS NOT NULL AND details ? 'error' THEN 'failed'
    ELSE 'success'
  END as status
FROM admin_audit_log

UNION ALL

SELECT 
  id::text as id,
  'role_audit' as source,
  actor_user_id as actor_id,
  action,
  target_user_id,
  NULL as target_email,
  jsonb_build_object('notes', notes) as details,
  NULL as ip_address,
  NULL as user_agent,
  created_at,
  'success' as status
FROM admin_role_audit;

-- Create admin_notifications table for in-app notifications
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  audience TEXT NOT NULL DEFAULT 'all', -- 'full', 'limited', 'all'
  link TEXT, -- deep link path
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_by UUID[] DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view notifications
CREATE POLICY "Admins can view notifications" 
ON public.admin_notifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM admin_memberships 
    WHERE user_id = auth.uid()
    AND (expires_at IS NULL OR expires_at > now())
  )
);

-- Policy: Full admins can create notifications
CREATE POLICY "Full admins can create notifications" 
ON public.admin_notifications 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_memberships 
    WHERE user_id = auth.uid()
    AND role = 'full'
    AND (expires_at IS NULL OR expires_at > now())
  )
);

-- Policy: Admins can update (mark as read)
CREATE POLICY "Admins can update notifications" 
ON public.admin_notifications 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM admin_memberships 
    WHERE user_id = auth.uid()
    AND (expires_at IS NULL OR expires_at > now())
  )
);

-- Create index for faster queries
CREATE INDEX idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
CREATE INDEX idx_admin_notifications_type ON admin_notifications(type);

-- Create function to notify admins on verification request
CREATE OR REPLACE FUNCTION notify_admin_on_verification_request()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_notifications (type, title, message, metadata, audience, link)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for verification requests
CREATE TRIGGER on_business_verification_request
AFTER INSERT ON business_verification_requests
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_verification_request();

CREATE TRIGGER on_golfer_verification_request
AFTER INSERT ON golfer_verification_requests
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_verification_request();

-- Create function to notify on invite accepted
CREATE OR REPLACE FUNCTION notify_admin_on_invite_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    INSERT INTO admin_notifications (type, title, message, metadata, audience, link)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_admin_invite_accepted
AFTER UPDATE ON admin_invitations
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_invite_accepted();

-- Create function to notify on expiring admin access (called by cron or manually)
CREATE OR REPLACE FUNCTION check_expiring_admin_access()
RETURNS void AS $$
DECLARE
  expiring_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO expiring_count
  FROM admin_memberships
  WHERE expires_at IS NOT NULL
    AND expires_at > now()
    AND expires_at <= now() + interval '7 days';
    
  IF expiring_count > 0 THEN
    -- Only insert if we haven't notified in the last 24 hours
    IF NOT EXISTS (
      SELECT 1 FROM admin_notifications 
      WHERE type = 'expiring_access' 
      AND created_at > now() - interval '24 hours'
    ) THEN
      INSERT INTO admin_notifications (type, title, message, metadata, audience, link)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;