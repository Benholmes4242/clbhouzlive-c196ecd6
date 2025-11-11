-- Admin Analytics RPCs for Echo History
-- These functions aggregate analytics events for admin dashboard

-- RPC: Summary cards (7/30/90 days)
CREATE OR REPLACE FUNCTION admin_echo_summary(days INTEGER)
RETURNS TABLE(
  period TEXT,
  conversations_created BIGINT,
  starred_toggles BIGINT,
  shares_created BIGINT,
  exports_started BIGINT,
  bulk_exports BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    days || 'd' AS period,
    SUM((name IN ('echo_history_open_full', 'echo_history_open_inline'))::INT) AS conversations_created,
    SUM((name = 'echo_history_star_toggled')::INT) AS starred_toggles,
    SUM((name = 'echo_share_created')::INT) AS shares_created,
    SUM((name = 'echo_history_export_started')::INT) AS exports_started,
    SUM((name = 'echo_history_export_bulk_started')::INT) AS bulk_exports
  FROM echo_events
  WHERE created_at >= NOW() - MAKE_INTERVAL(days => days)
    AND (
      -- Only allow admins to call this
      public.is_admin()
    );
$$;

-- RPC: Time series by day
CREATE OR REPLACE FUNCTION admin_echo_timeseries(event_names TEXT[], days INTEGER)
RETURNS TABLE(d DATE, n BIGINT)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    DATE_TRUNC('day', created_at)::DATE AS d, 
    COUNT(*) AS n
  FROM echo_events
  WHERE name = ANY(event_names)
    AND created_at >= NOW() - MAKE_INTERVAL(days => days)
    AND (
      -- Only allow admins to call this
      public.is_admin()
    )
  GROUP BY 1 
  ORDER BY 1;
$$;

-- RPC: Top tags (based on thread tag usage)
CREATE OR REPLACE FUNCTION admin_echo_top_tags(days INTEGER, limit_n INTEGER)
RETURNS TABLE(name TEXT, threads BIGINT)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.name::TEXT, 
    COUNT(DISTINCT ett.thread_id) AS threads
  FROM echo_thread_tags ett
  JOIN echo_tags t ON t.id = ett.tag_id
  WHERE EXISTS (
    -- Only allow admins to call this
    SELECT 1 WHERE public.is_admin()
  )
  GROUP BY t.name
  ORDER BY threads DESC
  LIMIT limit_n;
$$;

-- Grant execute permissions to authenticated users (security definer handles actual access)
GRANT EXECUTE ON FUNCTION admin_echo_summary(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_echo_timeseries(TEXT[], INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_echo_top_tags(INTEGER, INTEGER) TO authenticated;