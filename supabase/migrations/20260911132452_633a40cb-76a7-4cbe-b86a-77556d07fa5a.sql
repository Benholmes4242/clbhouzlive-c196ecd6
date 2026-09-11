-- The screen-analytics family reads page_path_map as its owner because the table
-- is intentionally closed (RLS on, no policy). A direct client select returned
-- 0 of 1,656 rows, which the panel could not tell apart from a screen with no
-- events. This is the same door get_screen_analytics already uses; page_path_map
-- deliberately gets NO member-facing policy.
CREATE OR REPLACE FUNCTION public.get_screen_event_paths(p_route_pattern text)
RETURNS TABLE(raw_path text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT m.raw_path
  FROM public.page_path_map m
  WHERE m.route_pattern = p_route_pattern
    AND EXISTS (SELECT 1 FROM public.is_admin() AS a(is_admin) WHERE a.is_admin = true)
$function$;

REVOKE ALL ON FUNCTION public.get_screen_event_paths(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_screen_event_paths(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_screen_event_paths(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_screen_event_paths(text) TO service_role;