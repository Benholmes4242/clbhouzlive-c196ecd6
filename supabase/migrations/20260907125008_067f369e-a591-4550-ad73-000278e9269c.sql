ALTER TABLE public.page_route_manifest
  ADD COLUMN IF NOT EXISTS is_shim boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS note text;

COMMENT ON COLUMN public.page_route_manifest.is_shim IS
  'True when the route only renders a <Navigate>/redirect component. A redirect is not a screen: it is excluded from get_screen_analytics unless it somehow records traffic.';

-- Redirect shims: every path in src/App.tsx whose element is a Navigate or a
-- *Redirect component. Verified against App.tsx on 7 Sep 2026.
UPDATE public.page_route_manifest SET is_shim = true, note = 'Redirect shim in src/App.tsx - not a screen.'
WHERE route_pattern IN (
  '/clubhouse','/community','/journey','/videos','/clips','/hub','/hub/*',
  '/echo-v2','/echo-v2/history','/echo-v2/:chatId','/season-shop','/challenges',
  '/creator/*','/creators/*','/game/:id','/games/discover','/nearby',
  '/profile/quest','/profile/quest/index','/profile/quest/replay',
  '/profile/handicap','/handicap/legends','/handicap/rivalry/:rivalUserId',
  '/handicap/:friendUserId/rivalry/:rivalUserId','/top100/:slug',
  '/achievements','/achievements/:userId','/achievementshub',
  '/admin','/admin/*','/friends','/followers','/following','/friends-activity',
  '/profile/:username/friends','/profile/:username/reviews',
  '/onboarding/account-type','/create-profile','/video/:videoId'
);

-- Test and developer entries: none of these paths is registered in src/App.tsx
-- any more except /error-logs (renders null) and /admin-setup (token-gated).
-- They only diluted the route count.
UPDATE public.page_route_manifest SET is_active = false, note = 'Test/dev route - retired from the manifest 7 Sep 2026.'
WHERE route_pattern IN (
  '/__drawer_audit','/__test/match-request','/dev/video-engine',
  '/overview-v4-test','/pending-post-test','/profile-sheet-v2-test',
  '/search-v2-test','/watch-v2-test','/error-logs','/admin-setup'
);

-- Stale rows: no <Route> exists for these paths at all, so they can never
-- record a page view and are not screens.
UPDATE public.page_route_manifest SET is_active = false, note = 'No route registered in src/App.tsx - stale manifest row, removed 7 Sep 2026.'
WHERE route_pattern IN ('/map','/messages-v2','/golferssharedcourses','/settings/my-businesses','/rivalry','/search');

CREATE OR REPLACE FUNCTION public.get_screen_analytics(p_days integer DEFAULT 30)
 RETURNS TABLE(route_pattern text, label text, area text, views bigint, unique_users bigint, unique_sessions bigint, median_dwell_sec numeric, events_fired bigint, prev_views bigint, trend_pct numeric)
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
  -- A redirect is not a screen: shims are excluded here so they can never be
  -- listed as zero-traffic. If a shim somehow records traffic it still appears
  -- through the second branch below, so nothing is hidden.
  SELECT m.route_pattern, m.label, m.area, m.sort_order
  FROM public.page_route_manifest m WHERE m.is_active AND NOT m.is_shim
  UNION
  SELECT c.route,
         COALESCE(base.label, c.route) ||
           CASE WHEN position('?' in c.route) > 0
                THEN ' - ' || split_part(c.route, '?', 2) ELSE '' END,
         COALESCE(base.area, 'Unlisted'),
         COALESCE(base.sort_order, 500)
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
       ELSE ROUND(((COALESCE(c.views,0)-p.views)::numeric/p.views)*100,1) END
FROM universe u
LEFT JOIN cur c ON c.route = u.route_pattern
LEFT JOIN prev p ON p.route = u.route_pattern
ORDER BY COALESCE(c.views,0) DESC, u.sort_order;
$function$;