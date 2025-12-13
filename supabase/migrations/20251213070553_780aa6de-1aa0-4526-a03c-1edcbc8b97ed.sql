-- Step 1: Eligibility signals table (one row per user)
CREATE TABLE IF NOT EXISTS public.golfer_eligibility_signals (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Computed signals (all internal)
  profile_completeness_score int NOT NULL DEFAULT 0,  -- 0-100
  has_external_links boolean NOT NULL DEFAULT false,
  
  mentions_30d int NOT NULL DEFAULT 0,
  unique_mentioners_30d int NOT NULL DEFAULT 0,
  
  course_tags_30d int NOT NULL DEFAULT 0,
  top100_course_tags_30d int NOT NULL DEFAULT 0,
  
  followers_count int NOT NULL DEFAULT 0,
  engagement_score_30d int NOT NULL DEFAULT 0,
  
  -- Derived flags
  candidate_state text NOT NULL DEFAULT 'monitor'
    CHECK (candidate_state IN ('monitor','notable_candidate','high_confidence_candidate')),
  
  last_computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_golfer_signals_state ON public.golfer_eligibility_signals (candidate_state);

-- Step 1: Admin overrides table (dismiss/pin)
CREATE TABLE IF NOT EXISTS public.golfer_candidate_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('dismiss','pin')),
  reason text,
  acted_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, action)
);

CREATE INDEX IF NOT EXISTS idx_candidate_overrides_user ON public.golfer_candidate_overrides (user_id);

-- Step 2: Invites table (invite-only flow)
CREATE TABLE IF NOT EXISTS public.golfer_verification_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, status)
);

-- Updated-at trigger
CREATE OR REPLACE FUNCTION public.set_golfer_signals_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_golfer_signals_updated_at ON public.golfer_eligibility_signals;
CREATE TRIGGER trg_golfer_signals_updated_at
BEFORE UPDATE ON public.golfer_eligibility_signals
FOR EACH ROW EXECUTE FUNCTION public.set_golfer_signals_updated_at();

-- Enable RLS
ALTER TABLE public.golfer_eligibility_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golfer_candidate_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golfer_verification_invites ENABLE ROW LEVEL SECURITY;

-- RLS: Signals (admin-only)
CREATE POLICY ges_select_admin ON public.golfer_eligibility_signals FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY ges_insert_admin ON public.golfer_eligibility_signals FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY ges_update_admin ON public.golfer_eligibility_signals FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- RLS: Overrides (admin-only)
CREATE POLICY gco_select_admin ON public.golfer_candidate_overrides FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY gco_insert_admin ON public.golfer_candidate_overrides FOR INSERT TO authenticated WITH CHECK (public.is_admin() AND acted_by = auth.uid());
CREATE POLICY gco_delete_admin ON public.golfer_candidate_overrides FOR DELETE TO authenticated USING (public.is_admin());

-- RLS: Invites (admin can manage, users can read their own)
CREATE POLICY gvi_select_admin ON public.golfer_verification_invites FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY gvi_select_own ON public.golfer_verification_invites FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY gvi_insert_admin ON public.golfer_verification_invites FOR INSERT TO authenticated WITH CHECK (public.is_admin() AND invited_by = auth.uid());
CREATE POLICY gvi_update_admin ON public.golfer_verification_invites FOR UPDATE TO authenticated USING (public.is_admin());

-- RPC: Invite golfer to verification (from Discover view)
CREATE OR REPLACE FUNCTION public.invite_golfer_from_discover(
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite_id uuid;
  v_admin_id uuid := auth.uid();
BEGIN
  -- Check admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can invite golfers';
  END IF;
  
  -- Check not already invited
  IF EXISTS (SELECT 1 FROM golfer_verification_invites WHERE user_id = p_user_id AND status = 'active') THEN
    RAISE EXCEPTION 'Golfer already has an active invite';
  END IF;
  
  -- Check not already verified
  IF EXISTS (SELECT 1 FROM user_profiles WHERE id = p_user_id AND is_verified_golfer = true) THEN
    RAISE EXCEPTION 'Golfer is already verified';
  END IF;
  
  -- Create invite
  INSERT INTO golfer_verification_invites (user_id, invited_by, status)
  VALUES (p_user_id, v_admin_id, 'active')
  RETURNING id INTO v_invite_id;
  
  -- Create in-app notification
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    p_user_id,
    'golfer_verification_invite',
    'You''re eligible for verification',
    'We believe your profile may qualify for golfer verification. You can request verification to help prevent impersonation.',
    jsonb_build_object('invite_id', v_invite_id)
  );
  
  RETURN jsonb_build_object('success', true, 'invite_id', v_invite_id);
END;
$$;

-- RPC: Dismiss candidate from Discover
CREATE OR REPLACE FUNCTION public.dismiss_golfer_candidate(
  p_user_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can dismiss candidates';
  END IF;
  
  INSERT INTO golfer_candidate_overrides (user_id, action, reason, acted_by)
  VALUES (p_user_id, 'dismiss', p_reason, auth.uid())
  ON CONFLICT (user_id, action) DO UPDATE SET reason = p_reason, acted_by = auth.uid();
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE golfer_eligibility_signals;
ALTER PUBLICATION supabase_realtime ADD TABLE golfer_candidate_overrides;
ALTER PUBLICATION supabase_realtime ADD TABLE golfer_verification_invites;