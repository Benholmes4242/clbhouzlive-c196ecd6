-- =====================================================
-- PHASE 1: CREATOR DUAL-PATH ARCHITECTURE MIGRATION
-- =====================================================

-- Step 1: Drop tables that reference creator_pages (respects FK order)
DROP TABLE IF EXISTS creator_members CASCADE;
DROP TABLE IF EXISTS creator_follows CASCADE;
DROP TABLE IF EXISTS creator_pages CASCADE;

-- Step 2: Rename creator_analytics_events → profile_analytics_events
ALTER TABLE creator_analytics_events RENAME TO profile_analytics_events;

-- Rename the foreign key column
ALTER TABLE profile_analytics_events 
  RENAME COLUMN creator_page_id TO profile_id;

-- Add profile_type for polymorphic reference
ALTER TABLE profile_analytics_events 
  ADD COLUMN profile_type TEXT NOT NULL DEFAULT 'personal'
  CHECK (profile_type IN ('personal', 'business'));

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_profile_analytics_profile 
  ON profile_analytics_events(profile_id, profile_type);

-- Step 3: Rename creator_daily_metrics → profile_daily_metrics
ALTER TABLE creator_daily_metrics RENAME TO profile_daily_metrics;

-- Rename column
ALTER TABLE profile_daily_metrics 
  RENAME COLUMN creator_page_id TO profile_id;

-- Add profile_type column
ALTER TABLE profile_daily_metrics 
  ADD COLUMN profile_type TEXT NOT NULL DEFAULT 'personal'
  CHECK (profile_type IN ('personal', 'business'));

-- Drop old primary key and add new one with profile_type
ALTER TABLE profile_daily_metrics 
  DROP CONSTRAINT IF EXISTS creator_daily_metrics_pkey;

ALTER TABLE profile_daily_metrics 
  ADD PRIMARY KEY (profile_id, profile_type, metric_date);

-- Step 4: Drop old creator functions
DROP FUNCTION IF EXISTS create_creator_page(uuid, text, text);
DROP FUNCTION IF EXISTS generate_creator_slug(text);
DROP FUNCTION IF EXISTS get_creator_page_ids_for_user(uuid);
DROP FUNCTION IF EXISTS get_default_creator_page(uuid);
DROP FUNCTION IF EXISTS user_is_creator_owner_or_admin(uuid, uuid);
DROP FUNCTION IF EXISTS track_creator_event;
DROP FUNCTION IF EXISTS track_creator_profile_visit;
DROP FUNCTION IF EXISTS aggregate_creator_daily_metrics;

-- Step 5: Create new polymorphic analytics function
CREATE OR REPLACE FUNCTION public.track_profile_analytics_event(
  p_profile_id UUID,
  p_profile_type TEXT,
  p_event_type TEXT,
  p_action_type TEXT DEFAULT NULL,
  p_content_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_source TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  IF p_profile_type NOT IN ('personal', 'business') THEN
    RAISE EXCEPTION 'Invalid profile_type: %', p_profile_type;
  END IF;
  
  INSERT INTO profile_analytics_events (
    profile_id,
    profile_type,
    event_type,
    action_type,
    content_id,
    user_id,
    source,
    metadata,
    event_hour
  ) VALUES (
    p_profile_id,
    p_profile_type,
    p_event_type::creator_event_type,
    p_action_type,
    p_content_id,
    p_user_id,
    p_source,
    p_metadata,
    date_trunc('hour', now())
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Step 6: Create aggregation function
CREATE OR REPLACE FUNCTION public.aggregate_profile_daily_metrics(
  target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day'
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO profile_daily_metrics (
    profile_id,
    profile_type,
    metric_date,
    impressions,
    profile_visits,
    new_followers,
    engagements,
    post_views,
    post_likes,
    post_comments,
    post_saves,
    unique_viewers
  )
  SELECT 
    profile_id,
    profile_type,
    target_date,
    COUNT(*) FILTER (WHERE event_type = 'impression'),
    COUNT(*) FILTER (WHERE event_type = 'profile_visit'),
    COUNT(*) FILTER (WHERE event_type = 'follow'),
    COUNT(*) FILTER (WHERE event_type IN ('post_like', 'post_comment', 'post_save', 'post_share')),
    COUNT(*) FILTER (WHERE event_type = 'post_view'),
    COUNT(*) FILTER (WHERE event_type = 'post_like'),
    COUNT(*) FILTER (WHERE event_type = 'post_comment'),
    COUNT(*) FILTER (WHERE event_type = 'post_save'),
    COUNT(DISTINCT user_id)
  FROM profile_analytics_events
  WHERE created_at >= target_date 
    AND created_at < target_date + INTERVAL '1 day'
  GROUP BY profile_id, profile_type
  ON CONFLICT (profile_id, profile_type, metric_date) 
  DO UPDATE SET
    impressions = EXCLUDED.impressions,
    profile_visits = EXCLUDED.profile_visits,
    new_followers = EXCLUDED.new_followers,
    engagements = EXCLUDED.engagements,
    post_views = EXCLUDED.post_views,
    post_likes = EXCLUDED.post_likes,
    post_comments = EXCLUDED.post_comments,
    post_saves = EXCLUDED.post_saves,
    unique_viewers = EXCLUDED.unique_viewers;
END;
$$;

-- Step 7: Update RLS policies for profile_analytics_events
DROP POLICY IF EXISTS "Public can view public creator pages" ON profile_analytics_events;
DROP POLICY IF EXISTS "Users can create their own creator pages" ON profile_analytics_events;
DROP POLICY IF EXISTS "Creator members can update their pages" ON profile_analytics_events;
DROP POLICY IF EXISTS "Only owners can delete creator pages" ON profile_analytics_events;

-- Enable RLS
ALTER TABLE profile_analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own analytics
CREATE POLICY "Users can read their own analytics"
  ON profile_analytics_events FOR SELECT
  USING (
    (profile_type = 'personal' AND profile_id = auth.uid())
    OR
    (profile_type = 'business' AND EXISTS (
      SELECT 1 FROM business_members 
      WHERE business_id = profile_id 
      AND user_profile_id = auth.uid()
    ))
  );

-- Analytics inserted via RPC only
CREATE POLICY "Analytics inserted via RPC only"
  ON profile_analytics_events FOR INSERT
  WITH CHECK (false);

-- Step 8: RLS for profile_daily_metrics
ALTER TABLE profile_daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own daily metrics"
  ON profile_daily_metrics FOR SELECT
  USING (
    (profile_type = 'personal' AND profile_id = auth.uid())
    OR
    (profile_type = 'business' AND EXISTS (
      SELECT 1 FROM business_members 
      WHERE business_id = profile_id 
      AND user_profile_id = auth.uid()
    ))
  );

-- Step 9: Clean up posts table (convert any 'creator' actor_type to 'personal')
UPDATE posts 
SET actor_type = 'personal' 
WHERE actor_type = 'creator';

-- Add comments for documentation
COMMENT ON TABLE profile_analytics_events IS 'Unified analytics events for both personal and business profiles';
COMMENT ON TABLE profile_daily_metrics IS 'Daily aggregated metrics for both personal and business profiles';
COMMENT ON FUNCTION track_profile_analytics_event IS 'Track an analytics event for a personal or business profile';
COMMENT ON FUNCTION aggregate_profile_daily_metrics IS 'Aggregate daily metrics from profile_analytics_events';