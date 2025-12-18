-- A2: Unique index to prevent duplicate business pages for the same club
CREATE UNIQUE INDEX IF NOT EXISTS uniq_business_accounts_club_id
ON public.business_accounts(club_id)
WHERE club_id IS NOT NULL;

-- A4: Business access requests table (for already-claimed clubs)
CREATE TABLE IF NOT EXISTS public.business_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  requester_user_profile_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  requested_role text NOT NULL DEFAULT 'team', -- 'team' | 'manager'
  message text,
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_bar_business ON public.business_access_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_bar_requester ON public.business_access_requests(requester_user_profile_id);
CREATE INDEX IF NOT EXISTS idx_bar_status ON public.business_access_requests(status);

-- A5: Update club_page_requests to use club_id FK instead of key/name
ALTER TABLE public.club_page_requests
ADD COLUMN IF NOT EXISTS requested_club_id uuid REFERENCES public.golf_clubs(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_cpr_club ON public.club_page_requests(requested_club_id);

-- Enable RLS on new tables
ALTER TABLE public.business_access_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for business_access_requests
-- Requesters can view and create their own requests
CREATE POLICY "bar_select_own" ON public.business_access_requests
  FOR SELECT USING (requester_user_profile_id = auth.uid());

CREATE POLICY "bar_insert_own" ON public.business_access_requests
  FOR INSERT WITH CHECK (requester_user_profile_id = auth.uid());

-- Business owners/admins can view and manage requests for their business
CREATE POLICY "bar_select_business" ON public.business_access_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = business_access_requests.business_id
      AND bm.user_profile_id = auth.uid()
      AND bm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "bar_update_business" ON public.business_access_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = business_access_requests.business_id
      AND bm.user_profile_id = auth.uid()
      AND bm.role IN ('owner', 'admin')
    )
  );

-- Update club_page_requests RLS to allow insert with club_id
DROP POLICY IF EXISTS "cpr_insert_auth" ON public.club_page_requests;
CREATE POLICY "cpr_insert_auth" ON public.club_page_requests
  FOR INSERT WITH CHECK (requester_user_profile_id = auth.uid());

-- Trigger to update updated_at on business_access_requests
CREATE OR REPLACE FUNCTION update_business_access_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_bar_updated_at ON public.business_access_requests;
CREATE TRIGGER trigger_bar_updated_at
  BEFORE UPDATE ON public.business_access_requests
  FOR EACH ROW EXECUTE FUNCTION update_business_access_requests_updated_at();