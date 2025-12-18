-- =============================================
-- ZERO-FRICTION HOME CLUB AUTO-LINKING SYSTEM
-- =============================================

-- 1.1 Add pending home club columns to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS home_club_pending_name TEXT;

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS home_club_pending_key TEXT;

CREATE INDEX IF NOT EXISTS idx_user_profiles_home_club_pending_key
ON public.user_profiles(home_club_pending_key);

-- 1.2 Add club matching fields to business_accounts
ALTER TABLE public.business_accounts
ADD COLUMN IF NOT EXISTS club_name TEXT;

ALTER TABLE public.business_accounts
ADD COLUMN IF NOT EXISTS club_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS ux_business_accounts_club_key
ON public.business_accounts(club_key) WHERE club_key IS NOT NULL;

-- =============================================
-- 2. NORMALIZATION FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.normalize_club_key(p_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(lower(trim(coalesce(p_name,''))), '[^a-z0-9]+', '', 'g');
$$;

-- =============================================
-- 3. TRIGGERS FOR AUTO-LINKING
-- =============================================

-- 3.1 Auto-set club_key when club_name is set
CREATE OR REPLACE FUNCTION public.set_business_club_key()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.club_name IS NOT NULL THEN
    NEW.club_key := public.normalize_club_key(NEW.club_name);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_business_set_club_key ON public.business_accounts;
CREATE TRIGGER trg_business_set_club_key
BEFORE INSERT OR UPDATE OF club_name
ON public.business_accounts
FOR EACH ROW
EXECUTE FUNCTION public.set_business_club_key();

-- 3.2 Auto-link pending members when business is created
CREATE OR REPLACE FUNCTION public.link_pending_home_club_members()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- When a business account is created/updated with a club_key,
  -- attach anyone who picked this club previously
  IF NEW.club_key IS NOT NULL THEN
    UPDATE public.user_profiles up
    SET
      home_club_business_id = NEW.id,
      home_club_pending_name = NULL,
      home_club_pending_key = NULL
    WHERE
      up.home_club_business_id IS NULL
      AND up.home_club_pending_key = NEW.club_key;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_business_link_pending_members ON public.business_accounts;
CREATE TRIGGER trg_business_link_pending_members
AFTER INSERT OR UPDATE OF club_key
ON public.business_accounts
FOR EACH ROW
EXECUTE FUNCTION public.link_pending_home_club_members();

-- =============================================
-- 4. CLUB PAGE REQUESTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.club_page_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_club_name TEXT NOT NULL,
  requested_club_key TEXT NOT NULL,
  manager_email TEXT,
  requester_user_profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending'  -- pending | contacted | created | closed
);

CREATE INDEX IF NOT EXISTS idx_club_page_requests_key
ON public.club_page_requests(requested_club_key);

CREATE INDEX IF NOT EXISTS idx_club_page_requests_requester
ON public.club_page_requests(requester_user_profile_id);

-- RLS for club_page_requests
ALTER TABLE public.club_page_requests ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can insert their own request
CREATE POLICY "cpr_insert_auth"
ON public.club_page_requests
FOR INSERT
TO authenticated
WITH CHECK (requester_user_profile_id = auth.uid());

-- Users can read their own requests
CREATE POLICY "cpr_select_own"
ON public.club_page_requests
FOR SELECT
TO authenticated
USING (requester_user_profile_id = auth.uid());

-- =============================================
-- 5. RPC: SET HOME CLUB (handles both existing and pending)
-- =============================================
CREATE OR REPLACE FUNCTION public.set_home_club(
  p_business_id UUID DEFAULT NULL,
  p_pending_name TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  IF p_business_id IS NOT NULL THEN
    -- Club exists, link directly
    UPDATE public.user_profiles
    SET 
      home_club_business_id = p_business_id,
      home_club_pending_name = NULL,
      home_club_pending_key = NULL
    WHERE id = auth.uid();
  ELSIF p_pending_name IS NOT NULL THEN
    -- Club doesn't exist yet, store as pending
    UPDATE public.user_profiles
    SET 
      home_club_business_id = NULL,
      home_club_pending_name = p_pending_name,
      home_club_pending_key = public.normalize_club_key(p_pending_name)
    WHERE id = auth.uid();
  ELSE
    -- Clear home club
    UPDATE public.user_profiles
    SET 
      home_club_business_id = NULL,
      home_club_pending_name = NULL,
      home_club_pending_key = NULL
    WHERE id = auth.uid();
  END IF;
END;
$$;

-- =============================================
-- 6. RPC: REQUEST CLUB PAGE
-- =============================================
CREATE OR REPLACE FUNCTION public.request_club_page(
  p_club_name TEXT,
  p_manager_email TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_request_id UUID;
  v_club_key TEXT;
BEGIN
  v_club_key := public.normalize_club_key(p_club_name);
  
  -- Insert the request
  INSERT INTO public.club_page_requests (
    requested_club_name,
    requested_club_key,
    manager_email,
    requester_user_profile_id
  )
  VALUES (
    p_club_name,
    v_club_key,
    p_manager_email,
    auth.uid()
  )
  RETURNING id INTO v_request_id;
  
  -- Also set as pending home club if not already set
  UPDATE public.user_profiles
  SET 
    home_club_pending_name = COALESCE(home_club_pending_name, p_club_name),
    home_club_pending_key = COALESCE(home_club_pending_key, v_club_key)
  WHERE id = auth.uid()
    AND home_club_business_id IS NULL;
  
  RETURN v_request_id;
END;
$$;

-- =============================================
-- 7. RPC: CREATE BUSINESS ACCOUNT (with auto owner setup)
-- =============================================
CREATE OR REPLACE FUNCTION public.create_business_account(
  p_name TEXT,
  p_club_name TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_business_id UUID;
BEGIN
  -- Create the business account
  INSERT INTO public.business_accounts (
    name,
    club_name,
    category,
    description
  )
  VALUES (
    p_name,
    COALESCE(p_club_name, p_name),
    p_category,
    p_description
  )
  RETURNING id INTO v_business_id;

  -- Add creator as owner in business_members (permissions)
  INSERT INTO public.business_members (business_id, user_profile_id, role)
  VALUES (v_business_id, auth.uid(), 'owner')
  ON CONFLICT DO NOTHING;

  -- Add creator as owner in business_team_members (visible team)
  INSERT INTO public.business_team_members (business_id, user_profile_id, role, created_by)
  VALUES (v_business_id, auth.uid(), 'owner', auth.uid())
  ON CONFLICT DO NOTHING;

  RETURN v_business_id;
END;
$$;