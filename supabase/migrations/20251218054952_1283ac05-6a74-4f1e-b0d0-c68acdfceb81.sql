-- Create business_team_members table for Team feature
CREATE TABLE public.business_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'director', 'admin', 'coach', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id)
);

-- Enable RLS
ALTER TABLE public.business_team_members ENABLE ROW LEVEL SECURITY;

-- Everyone can read team members (public directory)
CREATE POLICY "Team members are publicly readable"
ON public.business_team_members
FOR SELECT
USING (true);

-- Business owners/admins can manage team members
CREATE POLICY "Business members can insert team members"
ON public.business_team_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = business_team_members.business_id
    AND bm.user_profile_id = auth.uid()
    AND bm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Business members can update team members"
ON public.business_team_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = business_team_members.business_id
    AND bm.user_profile_id = auth.uid()
    AND bm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Business members can delete team members"
ON public.business_team_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = business_team_members.business_id
    AND bm.user_profile_id = auth.uid()
    AND bm.role IN ('owner', 'admin')
  )
);

-- Create index for efficient querying
CREATE INDEX idx_business_team_members_business_id ON public.business_team_members(business_id);
CREATE INDEX idx_business_team_members_user_id ON public.business_team_members(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_business_team_members_updated_at
BEFORE UPDATE ON public.business_team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();