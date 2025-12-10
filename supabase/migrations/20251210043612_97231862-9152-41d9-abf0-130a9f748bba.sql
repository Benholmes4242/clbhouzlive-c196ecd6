-- Add additional indexes for analytics queries on business_profile_events
CREATE INDEX IF NOT EXISTS idx_bpe_business_created 
  ON business_profile_events (business_id, created_at);

CREATE INDEX IF NOT EXISTS idx_bpe_event_type_created 
  ON business_profile_events (event_type, created_at);

-- Create daily insights view for aggregated analytics
CREATE OR REPLACE VIEW business_profile_daily_insights AS
SELECT
  business_id as business_profile_id,
  date_trunc('day', created_at)::date as day,
  count(*) filter (where event_type = 'profile_view') as profile_views,
  count(*) filter (where event_type = 'directory_impression') as directory_impressions,
  count(*) filter (where event_type in ('website_click', 'click_website', 'click_email', 'click_phone')) as click_outs,
  count(*) filter (where event_type = 'post_view') as post_views,
  count(*) filter (where event_type = 'post_engagement') as post_engagements,
  count(*) filter (where event_type = 'message_click') as message_clicks,
  count(*) filter (where event_type = 'mentioned_in_post') as mentions
FROM business_profile_events
GROUP BY business_id, date_trunc('day', created_at);

-- RPC for time-bounded daily analytics
CREATE OR REPLACE FUNCTION get_business_profile_analytics(
  p_business_profile_id uuid,
  p_days int default 30
)
RETURNS TABLE (
  day date,
  profile_views bigint,
  directory_impressions bigint,
  click_outs bigint,
  post_views bigint,
  post_engagements bigint,
  message_clicks bigint,
  mentions bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bpdi.day,
    bpdi.profile_views,
    bpdi.directory_impressions,
    bpdi.click_outs,
    bpdi.post_views,
    bpdi.post_engagements,
    bpdi.message_clicks,
    bpdi.mentions
  FROM business_profile_daily_insights bpdi
  WHERE bpdi.business_profile_id = p_business_profile_id
    AND bpdi.day >= current_date - p_days
  ORDER BY bpdi.day;
END;
$$ LANGUAGE plpgsql STABLE;

-- RPC for headline stats
CREATE OR REPLACE FUNCTION get_business_profile_headline_stats(
  p_business_profile_id uuid,
  p_days int default 30
)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'profile_views', coalesce(sum(profile_views), 0),
    'directory_impressions', coalesce(sum(directory_impressions), 0),
    'click_outs', coalesce(sum(click_outs), 0),
    'post_views', coalesce(sum(post_views), 0),
    'post_engagements', coalesce(sum(post_engagements), 0),
    'message_clicks', coalesce(sum(message_clicks), 0),
    'mentions', coalesce(sum(mentions), 0)
  )
  INTO result
  FROM business_profile_daily_insights
  WHERE business_profile_id = p_business_profile_id
    AND day >= current_date - p_days;

  RETURN coalesce(result, '{"profile_views":0,"directory_impressions":0,"click_outs":0,"post_views":0,"post_engagements":0,"message_clicks":0,"mentions":0}'::json);
END;
$$ LANGUAGE plpgsql STABLE;