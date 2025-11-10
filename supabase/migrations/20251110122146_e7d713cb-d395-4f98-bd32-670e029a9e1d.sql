-- 1) Create admin_role enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
    CREATE TYPE admin_role AS ENUM ('none', 'limited', 'full');
  END IF;
END $$;

-- 2) Create admin_memberships table (source of truth for admin roles)
CREATE TABLE IF NOT EXISTS public.admin_memberships (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('full', 'limited')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_memberships
ALTER TABLE public.admin_memberships ENABLE ROW LEVEL SECURITY;

-- Only service role can modify admin memberships (prevents privilege escalation)
CREATE POLICY "Only service role can manage admin memberships"
ON public.admin_memberships
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- 3) Unified role lookup function (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_admin_role()
RETURNS admin_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((
    SELECT CASE
             WHEN role = 'full' THEN 'full'::admin_role
             WHEN role = 'limited' THEN 'limited'::admin_role
           END
    FROM public.admin_memberships
    WHERE user_id = auth.uid()
  ), 'none'::admin_role);
$$;