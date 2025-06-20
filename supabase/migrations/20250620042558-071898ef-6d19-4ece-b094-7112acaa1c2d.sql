
-- Create admin_invitations table
CREATE TABLE public.admin_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_profiles table for admin team member details
CREATE TABLE public.admin_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Admin invitations policies
CREATE POLICY "Admins can view all invitations"
  ON public.admin_invitations
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can create invitations"
  ON public.admin_invitations
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update invitations"
  ON public.admin_invitations
  FOR UPDATE
  USING (public.is_admin());

-- Admin profiles policies
CREATE POLICY "Admins can view all admin profiles"
  ON public.admin_profiles
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Users can create their own admin profile"
  ON public.admin_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own admin profile"
  ON public.admin_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Insert your admin profile
INSERT INTO public.admin_profiles (user_id, first_name, last_name, email)
SELECT 
  au.id,
  'Ben',
  'Holmes',
  'bholmes@mbfitzgerald.co.uk'
FROM auth.users au
WHERE au.email = 'bholmes@mbfitzgerald.co.uk'
ON CONFLICT (user_id) DO NOTHING;
