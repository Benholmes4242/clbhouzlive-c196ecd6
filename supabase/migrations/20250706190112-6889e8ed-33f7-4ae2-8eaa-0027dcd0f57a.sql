-- Add admin audit log table for tracking admin actions
CREATE TABLE public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID,
  target_email TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy for admin audit log access
CREATE POLICY "Admins can view audit logs" 
ON public.admin_audit_log 
FOR SELECT 
USING (public.is_admin());

-- Create policy for system to insert audit logs
CREATE POLICY "System can create audit logs" 
ON public.admin_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Add email change security columns
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email_change_cooldown_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_change_count INTEGER DEFAULT 0;

-- Create function to check email change cooldown
CREATE OR REPLACE FUNCTION public.can_change_email(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cooldown_until TIMESTAMP WITH TIME ZONE;
  change_count INTEGER;
BEGIN
  SELECT email_change_cooldown_until, COALESCE(email_change_count, 0) INTO cooldown_until, change_count
  FROM public.user_profiles 
  WHERE id = user_id_param;
  
  -- If no cooldown set, allow change
  IF cooldown_until IS NULL THEN
    RETURN true;
  END IF;
  
  -- If cooldown period has passed, allow change
  IF cooldown_until < now() THEN
    RETURN true;
  END IF;
  
  -- If within cooldown period, deny change
  RETURN false;
END;
$$;