-- =====================================================
-- Phase 3 Security Hardening
-- A) RLS tightening on creator_members
-- B) Analytics insert guardrails
-- =====================================================

-- =====================================================
-- A) RLS TIGHTENING: creator_members
-- =====================================================

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Creator memberships are publicly readable" ON public.creator_members;

-- New policy: Only members of the creator page can see memberships
CREATE POLICY "Creator members can view their team"
ON public.creator_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.creator_members cm
    WHERE cm.creator_page_id = creator_members.creator_page_id
    AND cm.user_profile_id = auth.uid()
  )
);

-- Also allow the user to see their own memberships (for useMyCreators hook)
CREATE POLICY "Users can view their own memberships"
ON public.creator_members FOR SELECT
USING (user_profile_id = auth.uid());

-- =====================================================
-- A) OPTIONAL: Add is_public flag for future private pages
-- =====================================================

-- Add is_public column to creator_pages (default true for now)
ALTER TABLE public.creator_pages 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

-- Update the public SELECT policy on creator_pages to respect is_public
DROP POLICY IF EXISTS "Creator pages are publicly readable" ON public.creator_pages;

-- Public can only see public pages, OR members can see their own pages
CREATE POLICY "Public can view public creator pages"
ON public.creator_pages FOR SELECT
USING (
  is_public = true
  OR
  EXISTS (
    SELECT 1 FROM public.creator_members cm
    WHERE cm.creator_page_id = creator_pages.id
    AND cm.user_profile_id = auth.uid()
  )
);

-- =====================================================
-- B) ANALYTICS INSERT HARDENING
-- =====================================================

-- 1. Create an enum for allowed event types
DO $$ BEGIN
  CREATE TYPE public.creator_event_type AS ENUM (
    'impression',
    'profile_visit',
    'follow',
    'unfollow',
    'post_view',
    'post_like',
    'post_unlike',
    'post_comment',
    'post_save',
    'post_unsave',
    'post_share',
    'cta_click',
    'external_link_click'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Alter the event_type column to use the enum
ALTER TABLE public.creator_analytics_events 
ALTER COLUMN event_type TYPE public.creator_event_type 
USING event_type::public.creator_event_type;

-- 3. Add constraint on metadata size (limit to 10KB)
ALTER TABLE public.creator_analytics_events
ADD CONSTRAINT creator_analytics_events_metadata_size_check
CHECK (octet_length(metadata::text) <= 10240);

-- 4. Add a computed hour_bucket column for deduplication
-- Using a trigger to populate it (more reliable than generated columns for timestamps)
ALTER TABLE public.creator_analytics_events
ADD COLUMN IF NOT EXISTS event_hour TIMESTAMPTZ;

-- Create trigger to set event_hour on insert
CREATE OR REPLACE FUNCTION public.set_event_hour()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.event_hour := date_trunc('hour', NEW.created_at);
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_creator_analytics_event_hour
  BEFORE INSERT ON public.creator_analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_event_hour();

-- 5. Create dedupe index using the pre-computed hour column
CREATE UNIQUE INDEX IF NOT EXISTS idx_cae_dedupe 
ON public.creator_analytics_events (
  creator_page_id, 
  COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid),
  event_type, 
  COALESCE(content_id, '00000000-0000-0000-0000-000000000000'::uuid),
  event_hour
);

-- 6. Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can insert creator analytics events" ON public.creator_analytics_events;

-- 7. Create a secure RPC function for tracking events with built-in validation
CREATE OR REPLACE FUNCTION public.track_creator_event(
  p_creator_page_id UUID,
  p_event_type public.creator_event_type,
  p_content_id UUID DEFAULT NULL,
  p_source TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user (can be null for anonymous)
  v_user_id := auth.uid();
  
  -- Validate creator page exists
  IF NOT EXISTS (SELECT 1 FROM public.creator_pages WHERE id = p_creator_page_id) THEN
    RAISE EXCEPTION 'Invalid creator page';
  END IF;
  
  -- Validate metadata size
  IF p_metadata IS NOT NULL AND octet_length(p_metadata::text) > 10240 THEN
    RAISE EXCEPTION 'Metadata too large';
  END IF;
  
  -- Insert with ON CONFLICT to handle deduplication
  INSERT INTO public.creator_analytics_events (
    creator_page_id,
    event_type,
    content_id,
    user_id,
    source,
    metadata
  ) VALUES (
    p_creator_page_id,
    p_event_type,
    p_content_id,
    v_user_id,
    p_source,
    p_metadata
  )
  ON CONFLICT (creator_page_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), event_type, COALESCE(content_id, '00000000-0000-0000-0000-000000000000'::uuid), event_hour) 
  DO NOTHING
  RETURNING id INTO v_event_id;
  
  -- If dedupe prevented insert, that's fine - return null
  RETURN v_event_id;
END;
$$;

-- 8. Update RLS: Only allow inserts through the RPC (authenticated or anonymous via RPC)
-- The SECURITY DEFINER function bypasses RLS, so we can be restrictive here
CREATE POLICY "Events inserted via RPC only"
ON public.creator_analytics_events FOR INSERT
WITH CHECK (false); -- Direct inserts blocked; use track_creator_event RPC

-- 9. Also harden creator_profile_events the same way
DROP POLICY IF EXISTS "Anyone can insert profile events" ON public.creator_profile_events;

CREATE OR REPLACE FUNCTION public.track_creator_profile_visit(
  p_creator_page_id UUID,
  p_event_type TEXT DEFAULT 'visit',
  p_path TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  -- Validate creator page exists
  IF NOT EXISTS (SELECT 1 FROM public.creator_pages WHERE id = p_creator_page_id) THEN
    RAISE EXCEPTION 'Invalid creator page';
  END IF;
  
  -- Validate event_type is allowed
  IF p_event_type NOT IN ('visit', 'cta_click', 'tab_switch') THEN
    RAISE EXCEPTION 'Invalid event type';
  END IF;
  
  INSERT INTO public.creator_profile_events (
    creator_page_id,
    user_id,
    event_type,
    path
  ) VALUES (
    p_creator_page_id,
    auth.uid(),
    p_event_type,
    p_path
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

CREATE POLICY "Profile events inserted via RPC only"
ON public.creator_profile_events FOR INSERT
WITH CHECK (false);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION public.track_creator_event IS 'Secure RPC for tracking creator analytics events with validation and dedupe';
COMMENT ON FUNCTION public.track_creator_profile_visit IS 'Secure RPC for tracking creator profile visits';
COMMENT ON TYPE public.creator_event_type IS 'Allowed event types for creator analytics';
COMMENT ON COLUMN public.creator_pages.is_public IS 'Whether the creator page is publicly visible (false = members only)';
COMMENT ON COLUMN public.creator_analytics_events.event_hour IS 'Pre-computed hour bucket for deduplication index';