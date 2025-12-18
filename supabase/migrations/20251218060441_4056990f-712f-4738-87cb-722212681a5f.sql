-- Drop existing table to recreate with enum type and created_by
DROP TABLE IF EXISTS public.business_team_members CASCADE;

-- Team role enum
DO $$ BEGIN
  CREATE TYPE public.business_team_role AS ENUM ('owner','admin','director','coach','staff');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create business_team_members table
CREATE TABLE public.business_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  user_profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role public.business_team_role NOT NULL DEFAULT 'staff',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_profile_id)
);

-- Indexes
CREATE INDEX idx_btm_business_id ON public.business_team_members (business_id);
CREATE INDEX idx_btm_user_profile_id ON public.business_team_members (user_profile_id);
CREATE INDEX idx_btm_business_role ON public.business_team_members (business_id, role);

-- Enable RLS
ALTER TABLE public.business_team_members ENABLE ROW LEVEL SECURITY;

-- READ: public directory
CREATE POLICY "btm_read_all"
ON public.business_team_members
FOR SELECT
TO public
USING (true);

-- INSERT: only owner/admin of that business
CREATE POLICY "btm_insert_owner_admin"
ON public.business_team_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_id = business_team_members.business_id
      AND bm.user_profile_id = auth.uid()
      AND (bm.role = 'owner' OR bm.role = 'admin')
  )
);

-- UPDATE: only owner/admin of that business
CREATE POLICY "btm_update_owner_admin"
ON public.business_team_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_id = business_team_members.business_id
      AND bm.user_profile_id = auth.uid()
      AND (bm.role = 'owner' OR bm.role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_id = business_team_members.business_id
      AND bm.user_profile_id = auth.uid()
      AND (bm.role = 'owner' OR bm.role = 'admin')
  )
);

-- DELETE: only owner/admin of that business
CREATE POLICY "btm_delete_owner_admin"
ON public.business_team_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.business_members bm
    WHERE bm.business_id = business_team_members.business_id
      AND bm.user_profile_id = auth.uid()
      AND (bm.role = 'owner' OR bm.role = 'admin')
  )
);

-- RPC: Upsert team member
CREATE OR REPLACE FUNCTION public.upsert_business_team_member(
  p_business_id UUID,
  p_user_profile_id UUID,
  p_role public.business_team_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  INSERT INTO public.business_team_members (business_id, user_profile_id, role, created_by)
  VALUES (p_business_id, p_user_profile_id, p_role, auth.uid())
  ON CONFLICT (business_id, user_profile_id)
  DO UPDATE SET role = excluded.role;
END;
$$;

-- RPC: Delete team member
CREATE OR REPLACE FUNCTION public.delete_business_team_member(
  p_business_id UUID,
  p_user_profile_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  DELETE FROM public.business_team_members
  WHERE business_id = p_business_id
    AND user_profile_id = p_user_profile_id;
END;
$$;

-- Add home_club_business_id to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS home_club_business_id UUID
REFERENCES public.business_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_home_club
ON public.user_profiles (home_club_business_id);