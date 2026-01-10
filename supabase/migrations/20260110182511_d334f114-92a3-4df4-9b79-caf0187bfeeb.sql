-- =====================================================
-- PHASE 3: Creator Pages Entity Architecture
-- World-Class Creators Parity Program
-- =====================================================

-- =====================================================
-- 1. ENUMS
-- =====================================================

-- Creator team role enum (mirrors business_team_role pattern)
DO $$ BEGIN
  CREATE TYPE public.creator_team_role AS ENUM ('owner', 'admin', 'editor', 'analyst');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. CORE TABLES
-- =====================================================

-- creator_pages: First-class creator entities
CREATE TABLE public.creator_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile fields
  display_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  avatar_url TEXT,
  cover_url TEXT,
  bio TEXT,
  
  -- Location (simple fields for now, can expand later)
  location_city TEXT,
  location_country TEXT,
  
  -- Social links (JSONB for flexibility)
  social_links JSONB DEFAULT '{}'::jsonb,
  
  -- Creator categories/tags for discovery
  categories TEXT[] DEFAULT '{}',
  
  -- Verification
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique case-insensitive slug constraint
CREATE UNIQUE INDEX creator_pages_slug_unique ON public.creator_pages (LOWER(slug));

-- Index for owner lookups
CREATE INDEX idx_creator_pages_owner ON public.creator_pages (owner_user_id);

-- Enable RLS
ALTER TABLE public.creator_pages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- creator_members: Team membership for creator pages
-- =====================================================
CREATE TABLE public.creator_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_page_id UUID NOT NULL REFERENCES public.creator_pages(id) ON DELETE CASCADE,
  user_profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role public.creator_team_role NOT NULL DEFAULT 'editor',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint: one membership per user per creator page
  CONSTRAINT creator_members_unique UNIQUE (creator_page_id, user_profile_id)
);

-- Indexes for efficient lookups
CREATE INDEX idx_creator_members_user ON public.creator_members (user_profile_id);
CREATE INDEX idx_creator_members_page ON public.creator_members (creator_page_id);

-- Enable RLS
ALTER TABLE public.creator_members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- creator_follows: Users following creator pages
-- (Separate table, mirrors business_follows pattern)
-- =====================================================
CREATE TABLE public.creator_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  creator_page_id UUID NOT NULL REFERENCES public.creator_pages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint: one follow per user per creator page
  CONSTRAINT creator_follows_unique UNIQUE (follower_id, creator_page_id)
);

-- Indexes for efficient counts and lookups
CREATE INDEX idx_creator_follows_page ON public.creator_follows (creator_page_id);
CREATE INDEX idx_creator_follows_follower ON public.creator_follows (follower_id);

-- Enable RLS
ALTER TABLE public.creator_follows ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. ANALYTICS TABLES
-- =====================================================

-- creator_analytics_events: Raw analytics events
CREATE TABLE public.creator_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_page_id UUID NOT NULL REFERENCES public.creator_pages(id) ON DELETE CASCADE,
  
  -- Event classification
  event_type TEXT NOT NULL, -- 'impression', 'profile_visit', 'follow', 'post_view', 'post_like', etc.
  action_type TEXT, -- Sub-action if needed
  
  -- Context
  content_id UUID, -- Post ID or other content reference
  user_id UUID REFERENCES auth.users(id), -- Who triggered (null for anonymous)
  source TEXT, -- 'feed', 'profile', 'search', etc.
  
  -- Additional metadata
  metadata JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX idx_cae_page_created ON public.creator_analytics_events (creator_page_id, created_at);
CREATE INDEX idx_cae_page_event_created ON public.creator_analytics_events (creator_page_id, event_type, created_at);
CREATE INDEX idx_cae_content ON public.creator_analytics_events (creator_page_id, content_id);
CREATE INDEX idx_cae_user ON public.creator_analytics_events (user_id, created_at);

-- Enable RLS
ALTER TABLE public.creator_analytics_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- creator_daily_metrics: Aggregated daily metrics
-- =====================================================
CREATE TABLE public.creator_daily_metrics (
  creator_page_id UUID NOT NULL REFERENCES public.creator_pages(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  
  -- Core metrics
  impressions INTEGER NOT NULL DEFAULT 0,
  profile_visits INTEGER NOT NULL DEFAULT 0,
  new_followers INTEGER NOT NULL DEFAULT 0,
  
  -- Engagement metrics
  engagements INTEGER NOT NULL DEFAULT 0,
  post_views INTEGER NOT NULL DEFAULT 0,
  post_likes INTEGER NOT NULL DEFAULT 0,
  post_comments INTEGER NOT NULL DEFAULT 0,
  post_saves INTEGER NOT NULL DEFAULT 0,
  
  -- Reach
  unique_viewers INTEGER NOT NULL DEFAULT 0,
  
  -- Primary key on composite
  PRIMARY KEY (creator_page_id, metric_date)
);

-- Index for date range queries
CREATE INDEX idx_cdm_page_date ON public.creator_daily_metrics (creator_page_id, metric_date DESC);

-- Enable RLS
ALTER TABLE public.creator_daily_metrics ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- creator_profile_events: Profile visit tracking
-- (Equivalent to business_profile_events)
-- =====================================================
CREATE TABLE public.creator_profile_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_page_id UUID NOT NULL REFERENCES public.creator_pages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id), -- null for anonymous
  event_type TEXT NOT NULL DEFAULT 'visit', -- 'visit', 'cta_click', etc.
  path TEXT, -- Which page/section
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for visit counting
CREATE INDEX idx_cpe_page_created ON public.creator_profile_events (creator_page_id, created_at);

-- Enable RLS
ALTER TABLE public.creator_profile_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

-- creator_pages policies
CREATE POLICY "Creator pages are publicly readable"
ON public.creator_pages FOR SELECT
USING (true);

CREATE POLICY "Creator members can update their pages"
ON public.creator_pages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.creator_members cm
    WHERE cm.creator_page_id = creator_pages.id
    AND cm.user_profile_id = auth.uid()
    AND cm.role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY "Users can create their own creator pages"
ON public.creator_pages FOR INSERT
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Only owners can delete creator pages"
ON public.creator_pages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.creator_members cm
    WHERE cm.creator_page_id = creator_pages.id
    AND cm.user_profile_id = auth.uid()
    AND cm.role = 'owner'
  )
);

-- creator_members policies
CREATE POLICY "Creator memberships are publicly readable"
ON public.creator_members FOR SELECT
USING (true);

CREATE POLICY "Owners and admins can add members"
ON public.creator_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.creator_members cm
    WHERE cm.creator_page_id = creator_members.creator_page_id
    AND cm.user_profile_id = auth.uid()
    AND cm.role IN ('owner', 'admin')
  )
  OR
  -- Allow owner to add themselves when creating the page
  (creator_members.user_profile_id = auth.uid() AND creator_members.role = 'owner')
);

CREATE POLICY "Owners and admins can update members"
ON public.creator_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.creator_members cm
    WHERE cm.creator_page_id = creator_members.creator_page_id
    AND cm.user_profile_id = auth.uid()
    AND cm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Owners and admins can remove members"
ON public.creator_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.creator_members cm
    WHERE cm.creator_page_id = creator_members.creator_page_id
    AND cm.user_profile_id = auth.uid()
    AND cm.role IN ('owner', 'admin')
  )
  OR
  -- Members can remove themselves
  creator_members.user_profile_id = auth.uid()
);

-- creator_follows policies
CREATE POLICY "Anyone can view creator follows"
ON public.creator_follows FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can follow creators"
ON public.creator_follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow creators"
ON public.creator_follows FOR DELETE
USING (auth.uid() = follower_id);

-- creator_analytics_events policies
CREATE POLICY "Anyone can insert creator analytics events"
ON public.creator_analytics_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "Creator members can read their analytics"
ON public.creator_analytics_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.creator_members cm
    WHERE cm.creator_page_id = creator_analytics_events.creator_page_id
    AND cm.user_profile_id = auth.uid()
  )
);

-- creator_daily_metrics policies
CREATE POLICY "Creator members can read their daily metrics"
ON public.creator_daily_metrics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.creator_members cm
    WHERE cm.creator_page_id = creator_daily_metrics.creator_page_id
    AND cm.user_profile_id = auth.uid()
  )
);

-- creator_profile_events policies
CREATE POLICY "Anyone can insert profile events"
ON public.creator_profile_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "Creator members can read their profile events"
ON public.creator_profile_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.creator_members cm
    WHERE cm.creator_page_id = creator_profile_events.creator_page_id
    AND cm.user_profile_id = auth.uid()
  )
);

-- =====================================================
-- 5. POSTS TABLE: Prepare for actor_type = 'creator'
-- =====================================================

-- Add RLS policy for creator posting
-- (Existing policies handle personal/business; add creator support)

CREATE POLICY "Creator members can post as their creator page"
ON public.posts FOR INSERT
WITH CHECK (
  actor_type != 'creator'
  OR
  EXISTS (
    SELECT 1 FROM public.creator_members cm
    WHERE cm.creator_page_id = posts.actor_id
    AND cm.user_profile_id = auth.uid()
    AND cm.role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY "Creator members can update their creator posts"
ON public.posts FOR UPDATE
USING (
  actor_type != 'creator'
  OR
  EXISTS (
    SELECT 1 FROM public.creator_members cm
    WHERE cm.creator_page_id = posts.actor_id
    AND cm.user_profile_id = auth.uid()
    AND cm.role IN ('owner', 'admin', 'editor')
  )
);

CREATE POLICY "Creator members can delete their creator posts"
ON public.posts FOR DELETE
USING (
  actor_type != 'creator'
  OR
  EXISTS (
    SELECT 1 FROM public.creator_members cm
    WHERE cm.creator_page_id = posts.actor_id
    AND cm.user_profile_id = auth.uid()
    AND cm.role IN ('owner', 'admin', 'editor')
  )
);

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to generate unique slug from display name
CREATE OR REPLACE FUNCTION public.generate_creator_slug(p_display_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug: lowercase, replace spaces with hyphens, remove special chars
  base_slug := LOWER(TRIM(p_display_name));
  base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
  base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
  base_slug := TRIM(BOTH '-' FROM base_slug);
  
  -- Ensure minimum length
  IF LENGTH(base_slug) < 3 THEN
    base_slug := base_slug || '-creator';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM public.creator_pages WHERE LOWER(slug) = LOWER(final_slug)) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::TEXT;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Function to create a creator page with owner membership in one transaction
CREATE OR REPLACE FUNCTION public.create_creator_page(
  p_display_name TEXT,
  p_slug TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator_id UUID;
  v_final_slug TEXT;
BEGIN
  -- Generate slug if not provided
  IF p_slug IS NULL OR p_slug = '' THEN
    v_final_slug := public.generate_creator_slug(p_display_name);
  ELSE
    v_final_slug := p_slug;
  END IF;
  
  -- Create the creator page
  INSERT INTO public.creator_pages (
    owner_user_id,
    display_name,
    slug,
    avatar_url,
    bio
  ) VALUES (
    auth.uid(),
    p_display_name,
    v_final_slug,
    p_avatar_url,
    p_bio
  )
  RETURNING id INTO v_creator_id;
  
  -- Add the creator as owner
  INSERT INTO public.creator_members (
    creator_page_id,
    user_profile_id,
    role,
    created_by
  ) VALUES (
    v_creator_id,
    auth.uid(),
    'owner',
    auth.uid()
  );
  
  RETURN v_creator_id;
END;
$$;

-- Function to get a user's default creator page (first owned)
CREATE OR REPLACE FUNCTION public.get_default_creator_page(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT cp.id
  FROM public.creator_pages cp
  JOIN public.creator_members cm ON cm.creator_page_id = cp.id
  WHERE cm.user_profile_id = p_user_id
    AND cm.role = 'owner'
  ORDER BY cp.created_at ASC
  LIMIT 1;
$$;

-- Function to aggregate daily metrics (mirrors business pattern)
CREATE OR REPLACE FUNCTION public.aggregate_creator_daily_metrics(target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.creator_daily_metrics (
    creator_page_id,
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
    cae.creator_page_id,
    target_date,
    COUNT(*) FILTER (WHERE event_type = 'impression'),
    COUNT(*) FILTER (WHERE event_type = 'profile_visit'),
    COUNT(*) FILTER (WHERE event_type = 'follow'),
    COUNT(*) FILTER (WHERE event_type IN ('post_like', 'post_comment', 'post_save', 'post_share')),
    COUNT(*) FILTER (WHERE event_type = 'post_view'),
    COUNT(*) FILTER (WHERE event_type = 'post_like'),
    COUNT(*) FILTER (WHERE event_type = 'post_comment'),
    COUNT(*) FILTER (WHERE event_type = 'post_save'),
    COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)
  FROM public.creator_analytics_events cae
  WHERE cae.created_at >= target_date
    AND cae.created_at < target_date + INTERVAL '1 day'
  GROUP BY cae.creator_page_id
  ON CONFLICT (creator_page_id, metric_date) DO UPDATE SET
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

-- =====================================================
-- 7. BACKFILL MIGRATION
-- For all user_profiles where is_creator = true:
-- - Create default creator_pages row
-- - Create creator_members row as owner
-- =====================================================

-- Note: Currently 0 creators exist, but this handles future backfills
DO $$
DECLARE
  r RECORD;
  v_creator_id UUID;
  v_slug TEXT;
BEGIN
  FOR r IN 
    SELECT 
      up.id,
      up.display_name,
      up.username,
      up.profile_photo_url,
      up.bio
    FROM public.user_profiles up
    WHERE up.is_creator = true
      AND NOT EXISTS (
        SELECT 1 FROM public.creator_members cm
        WHERE cm.user_profile_id = up.id AND cm.role = 'owner'
      )
  LOOP
    -- Generate unique slug from username or display_name
    v_slug := public.generate_creator_slug(COALESCE(r.username, r.display_name, 'creator'));
    
    -- Create creator page
    INSERT INTO public.creator_pages (
      owner_user_id,
      display_name,
      slug,
      avatar_url,
      bio
    ) VALUES (
      r.id,
      COALESCE(r.display_name, r.username, 'Creator'),
      v_slug,
      r.profile_photo_url,
      r.bio
    )
    RETURNING id INTO v_creator_id;
    
    -- Add as owner
    INSERT INTO public.creator_members (
      creator_page_id,
      user_profile_id,
      role,
      created_by
    ) VALUES (
      v_creator_id,
      r.id,
      'owner',
      r.id
    );
  END LOOP;
END $$;

-- =====================================================
-- 8. UPDATED_AT TRIGGER
-- =====================================================

-- Trigger function (reuse if exists, else create)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to creator_pages
CREATE TRIGGER set_creator_pages_updated_at
  BEFORE UPDATE ON public.creator_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- 9. REALTIME SUPPORT (Optional, for future use)
-- =====================================================

-- Enable REPLICA IDENTITY FULL for realtime subscriptions
ALTER TABLE public.creator_follows REPLICA IDENTITY FULL;

-- Add to realtime publication if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'creator_follows'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.creator_follows;
    END IF;
  END IF;
END $$;

-- =====================================================
-- 10. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.creator_pages IS 'First-class creator page entities - Phase 3 of World-Class Creators Parity Program';
COMMENT ON TABLE public.creator_members IS 'Team memberships for creator pages with role-based access';
COMMENT ON TABLE public.creator_follows IS 'Users following creator pages';
COMMENT ON TABLE public.creator_analytics_events IS 'Raw analytics events for creator pages';
COMMENT ON TABLE public.creator_daily_metrics IS 'Aggregated daily metrics for creator insights';
COMMENT ON TABLE public.creator_profile_events IS 'Profile visit and CTA tracking for creator pages';
COMMENT ON COLUMN public.posts.actor_type IS 'Who the post was created as: personal, creator, or business';
COMMENT ON FUNCTION public.get_default_creator_page IS 'Returns the first owned creator page for routing compatibility';