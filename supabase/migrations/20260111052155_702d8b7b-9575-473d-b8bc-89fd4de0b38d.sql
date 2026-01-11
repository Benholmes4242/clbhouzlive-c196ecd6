-- FIX 2a: Clean up existing orphaned users
INSERT INTO public.user_profiles (
  id, username, display_name, user_type, is_public, has_completed_onboarding
)
SELECT 
  u.id,
  LOWER(SPLIT_PART(u.email, '@', 1)) || '_' || LEFT(u.id::text, 8) as username,
  COALESCE(u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1)) as display_name,
  'individual',
  true,
  false
FROM auth.users u
LEFT JOIN public.user_profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- FIX 2b: Create error tracking table
CREATE TABLE IF NOT EXISTS public.profile_creation_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  error_message TEXT NOT NULL,
  error_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Add indexes for monitoring
CREATE INDEX IF NOT EXISTS idx_profile_errors_created 
ON public.profile_creation_errors(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_errors_unresolved 
ON public.profile_creation_errors(resolved_at) 
WHERE resolved_at IS NULL;

-- Enable RLS
ALTER TABLE public.profile_creation_errors ENABLE ROW LEVEL SECURITY;

-- Only admins can view errors (no public access)
CREATE POLICY "Admins can view profile creation errors"
ON public.profile_creation_errors
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_memberships
    WHERE user_id = auth.uid()
  )
);