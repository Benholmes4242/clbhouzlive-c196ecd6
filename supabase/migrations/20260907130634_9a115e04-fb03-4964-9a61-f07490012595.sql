ALTER TABLE public.page_route_manifest
  ADD COLUMN IF NOT EXISTS is_dev boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.page_route_manifest.is_dev IS
  'True for test/developer screens. They stay ACTIVE and listed so they remain visible and removable, but they are excluded from the zero-traffic / dead-screen reading.';

UPDATE public.page_route_manifest
SET is_active = true,
    is_dev = true,
    area = 'Dev',
    note = 'Test/dev entry. Kept in the manifest on purpose so it stays visible and removable. Excluded from the dead-screen count. Reachability audited 7 Sep 2026: only /error-logs (renders null, ungated) and /admin-setup (token + admin-only RLS on admin_invitations) are registered in src/App.tsx; the rest have no <Route>.'
WHERE route_pattern IN (
  '/__drawer_audit','/__test/match-request','/dev/video-engine',
  '/overview-v4-test','/pending-post-test','/profile-sheet-v2-test',
  '/search-v2-test','/watch-v2-test','/error-logs','/admin-setup'
);

DROP FUNCTION IF EXISTS public.get_screen_analytics(integer);

CREATE OR REPLACE FUNCTION public.get_screen_analytics(p_days integer DEFAULT 30)
 RETURNS TABLE(route_pattern text, label text, area text, views bigint, unique_users bigint, unique_sessions bigint, median_dwell_sec numeric, events_fired bigint, prev_views bigint, trend_pct numeric, is_dev boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
WITH bounds AS (
  SELECT now() - (p_days||' days')::interval AS cur_start,
         now() - ((p_days*2)||' days')::interval AS prev_start),
ev AS (
  SELECT m.route_pattern AS route, e.name, e.user_id, e.created_at,
         e.props->>'session_id' AS session_id,
         (e.props->>'duration_sec')::numeric AS dwell
  FROM public.analytics_events e
  JOIN public.page_path_map m
    ON m.raw_path = COALESCE(e.props->>'path', e.props->>'page')
  CROSS JOIN bounds b WHERE e.created_at >= b.prev_start),
cur AS (
  SELECT route,
    COUNT(*) FILTER (WHERE name='page_view') AS views,
    COUNT(DISTINCT user_id) FILTER (WHERE name='page_view') AS unique_users,
    COUNT(DISTINCT session_id) FILTER (WHERE name='page_view') AS unique_sessions,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY dwell)
      FILTER (WHERE name='page_exit' AND dwell>0 AND dwell<3600) AS median_dwell,
    COUNT(*) FILTER (WHERE name NOT IN ('page_view','page_exit')) AS events_fired
  FROM ev CROSS JOIN bounds b WHERE ev.created_at >= b.cur_start GROUP BY route),
prev AS (
  SELECT route, COUNT(*) FILTER (WHERE name='page_view') AS views
  FROM ev CROSS JOIN bounds b
  WHERE ev.created_at >= b.prev_start AND ev.created_at < b.cur_start GROUP BY route),
universe AS (
  -- A redirect is not a screen: shims are excluded. Dev entries ARE included
  -- (marked, not removed) and carry is_dev so the reader can exclude them from
  -- the dead-screen figure without hiding them.
  SELECT m.route_pattern, m.label, m.area, m.sort_order, m.is_dev
  FROM public.page_route_manifest m WHERE m.is_active AND NOT m.is_shim
  UNION
  SELECT c.route,
         COALESCE(base.label, c.route) ||
           CASE WHEN position('?' in c.route) > 0
                THEN ' - ' || split_part(c.route, '?', 2) ELSE '' END,
         COALESCE(base.area, 'Unlisted'),
         COALESCE(base.sort_order, 500),
         COALESCE(base.is_dev, false)
  FROM cur c
  LEFT JOIN public.page_route_manifest base
    ON base.route_pattern = split_part(c.route, '?', 1)
  WHERE NOT EXISTS (SELECT 1 FROM public.page_route_manifest m2
                    WHERE m2.route_pattern = c.route AND m2.is_active AND NOT m2.is_shim))
SELECT u.route_pattern, u.label, u.area,
  COALESCE(c.views,0)::bigint, COALESCE(c.unique_users,0)::bigint,
  COALESCE(c.unique_sessions,0)::bigint, ROUND(c.median_dwell::numeric,1),
  COALESCE(c.events_fired,0)::bigint, COALESCE(p.views,0)::bigint,
  CASE WHEN COALESCE(p.views,0)=0 THEN NULL
       ELSE ROUND(((COALESCE(c.views,0)-p.views)::numeric/p.views)*100,1) END,
  u.is_dev
FROM universe u
LEFT JOIN cur c ON c.route = u.route_pattern
LEFT JOIN prev p ON p.route = u.route_pattern
ORDER BY COALESCE(c.views,0) DESC, u.sort_order;
$function$;