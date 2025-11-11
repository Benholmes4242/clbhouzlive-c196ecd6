-- Echo Analytics Dashboard RPCs

-- 1) Summary KPIs
CREATE OR REPLACE FUNCTION admin_echo_kpis()
RETURNS TABLE(
  users_active_7d INT,
  threads_total INT,
  msgs_total INT,
  exports_7d INT,
  shares_active INT
) LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT COUNT(DISTINCT user_id) FROM echo_threads WHERE last_activity_at >= NOW() - INTERVAL '7 days')::INT AS users_active_7d,
    (SELECT COUNT(*) FROM echo_threads)::INT AS threads_total,
    (SELECT COUNT(*) FROM echo_messages)::INT AS msgs_total,
    0::INT AS exports_7d, -- Placeholder until echo_export_events exists
    (SELECT COUNT(*) FROM echo_share_links WHERE revoked_at IS NULL)::INT AS shares_active
$$;

-- 2) Time-series: new threads per day (last 60 days)
CREATE OR REPLACE FUNCTION admin_echo_threads_timeseries()
RETURNS TABLE(ts DATE, threads INT) LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
  SELECT DATE_TRUNC('day', created_at)::DATE AS ts, COUNT(*)::INT AS threads
  FROM echo_threads
  WHERE created_at >= NOW() - INTERVAL '60 days'
  GROUP BY 1 ORDER BY 1
$$;

-- 3) Top tags (last 30 days)
CREATE OR REPLACE FUNCTION admin_echo_top_tags()
RETURNS TABLE(tag TEXT, uses INT) LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
  SELECT t.name AS tag, COUNT(*)::INT AS uses
  FROM echo_thread_tags tt
  JOIN echo_tags t ON t.id = tt.tag_id
  JOIN echo_threads et ON et.id = tt.thread_id
  WHERE et.last_activity_at >= NOW() - INTERVAL '30 days'
  GROUP BY 1 ORDER BY 2 DESC LIMIT 20
$$;

-- 4) Star / response rates (last 30 days rolling)
CREATE OR REPLACE FUNCTION admin_echo_rates()
RETURNS TABLE(
  period TEXT,
  pct_starred NUMERIC,
  pct_with_response NUMERIC
) LANGUAGE SQL SECURITY DEFINER SET search_path = public AS $$
  SELECT
    '30d'::TEXT AS period,
    ROUND(100.0 * AVG(CASE WHEN is_starred THEN 1 ELSE 0 END)::NUMERIC, 1) AS pct_starred,
    ROUND(100.0 * AVG(CASE WHEN EXISTS(SELECT 1 FROM echo_messages m WHERE m.thread_id = et.id AND m.role IN ('assistant','model')) THEN 1 ELSE 0 END)::NUMERIC, 1) AS pct_with_response
  FROM echo_threads et
  WHERE et.last_activity_at >= NOW() - INTERVAL '30 days'
$$;

-- Grant execute to authenticated users (admin check will be in frontend)
GRANT EXECUTE ON FUNCTION admin_echo_kpis() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_echo_threads_timeseries() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_echo_top_tags() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_echo_rates() TO authenticated;