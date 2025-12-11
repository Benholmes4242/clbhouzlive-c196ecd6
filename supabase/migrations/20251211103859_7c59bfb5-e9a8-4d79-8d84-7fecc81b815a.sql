-- Business Analytics Events table
CREATE TABLE public.business_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Which business this event belongs to
  business_id uuid NOT NULL
    REFERENCES public.business_accounts(id)
    ON DELETE CASCADE,
  
  -- Who triggered it (nullable for logged-out views)
  user_id uuid
    REFERENCES auth.users(id),
  
  -- What happened
  event_type text NOT NULL CHECK (
    event_type IN (
      'profile_visit',
      'action',
      'content_impression',
      'content_engagement',
      'review_submitted',
      'follow'
    )
  ),
  
  -- Optional: more detail for the event
  action_type text,
  source text,
  content_id uuid,
  
  -- Extra flexible space
  metadata jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX idx_bae_business_created ON public.business_analytics_events (business_id, created_at);
CREATE INDEX idx_bae_business_event_created ON public.business_analytics_events (business_id, event_type, created_at);
CREATE INDEX idx_bae_business_content ON public.business_analytics_events (business_id, content_id);
CREATE INDEX idx_bae_user_created ON public.business_analytics_events (user_id, created_at);

-- Daily rollups table for fast queries
CREATE TABLE public.business_daily_metrics (
  business_id uuid NOT NULL
    REFERENCES public.business_accounts(id)
    ON DELETE CASCADE,
  
  metric_date date NOT NULL,
  
  profile_visits integer NOT NULL DEFAULT 0,
  golfers_reached integer NOT NULL DEFAULT 0,
  actions_total integer NOT NULL DEFAULT 0,
  actions_call integer NOT NULL DEFAULT 0,
  actions_website integer NOT NULL DEFAULT 0,
  actions_directions integer NOT NULL DEFAULT 0,
  actions_message integer NOT NULL DEFAULT 0,
  
  impressions integer NOT NULL DEFAULT 0,
  engagements integer NOT NULL DEFAULT 0,
  
  new_followers integer NOT NULL DEFAULT 0,
  reviews_count integer NOT NULL DEFAULT 0,
  
  PRIMARY KEY (business_id, metric_date)
);

-- Enable RLS
ALTER TABLE public.business_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_daily_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for events - anyone can insert (for tracking)
CREATE POLICY "Anyone can insert analytics events"
ON public.business_analytics_events
FOR INSERT
WITH CHECK (true);

-- Only business members can read their business events
CREATE POLICY "Business members can read their events"
ON public.business_analytics_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = business_analytics_events.business_id
    AND bm.user_profile_id = auth.uid()
  )
);

-- RLS policies for daily metrics
CREATE POLICY "Business members can read their metrics"
ON public.business_daily_metrics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.business_members bm
    WHERE bm.business_id = business_daily_metrics.business_id
    AND bm.user_profile_id = auth.uid()
  )
);

-- Function to aggregate daily metrics
CREATE OR REPLACE FUNCTION public.aggregate_business_daily_metrics(target_date date DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.business_daily_metrics (
    business_id,
    metric_date,
    profile_visits,
    golfers_reached,
    actions_total,
    actions_call,
    actions_website,
    actions_directions,
    actions_message,
    impressions,
    engagements,
    new_followers,
    reviews_count
  )
  SELECT
    business_id,
    target_date as metric_date,
    COUNT(*) FILTER (WHERE event_type = 'profile_visit') as profile_visits,
    COUNT(DISTINCT user_id) FILTER (WHERE event_type IN ('profile_visit', 'content_impression')) as golfers_reached,
    COUNT(*) FILTER (WHERE event_type = 'action') as actions_total,
    COUNT(*) FILTER (WHERE event_type = 'action' AND action_type = 'call') as actions_call,
    COUNT(*) FILTER (WHERE event_type = 'action' AND action_type = 'website') as actions_website,
    COUNT(*) FILTER (WHERE event_type = 'action' AND action_type = 'directions') as actions_directions,
    COUNT(*) FILTER (WHERE event_type = 'action' AND action_type = 'message') as actions_message,
    COUNT(*) FILTER (WHERE event_type = 'content_impression') as impressions,
    COUNT(*) FILTER (WHERE event_type = 'content_engagement') as engagements,
    COUNT(*) FILTER (WHERE event_type = 'follow') as new_followers,
    COUNT(*) FILTER (WHERE event_type = 'review_submitted') as reviews_count
  FROM public.business_analytics_events
  WHERE created_at >= target_date
    AND created_at < target_date + INTERVAL '1 day'
  GROUP BY business_id
  ON CONFLICT (business_id, metric_date) DO UPDATE SET
    profile_visits = EXCLUDED.profile_visits,
    golfers_reached = EXCLUDED.golfers_reached,
    actions_total = EXCLUDED.actions_total,
    actions_call = EXCLUDED.actions_call,
    actions_website = EXCLUDED.actions_website,
    actions_directions = EXCLUDED.actions_directions,
    actions_message = EXCLUDED.actions_message,
    impressions = EXCLUDED.impressions,
    engagements = EXCLUDED.engagements,
    new_followers = EXCLUDED.new_followers,
    reviews_count = EXCLUDED.reviews_count;
END;
$$;