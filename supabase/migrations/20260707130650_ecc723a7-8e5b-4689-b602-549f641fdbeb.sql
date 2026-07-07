-- Applied manually by Ben in Supabase on 2026-07-07.
-- Included for repo history; safe no-op if re-run (DROP IF EXISTS + CREATE OR REPLACE).
--
-- Extends get_course_legends with 30-day movement (rank_30d + delta).
-- Two ranking passes over gam_course_legends historical rows:
--   * rank_now  — per-user best value in the current window, ranked
--   * rank_30d  — same ranking logic restricted to attained_at <= now() - 30d
-- No new tables; no rank-history stored. Visibility rules preserved.

DROP FUNCTION IF EXISTS public.get_course_legends(uuid, uuid);

CREATE OR REPLACE FUNCTION public.get_course_legends(
  p_course_id uuid,
  p_viewer_id uuid DEFAULT auth.uid()
)
RETURNS TABLE(
  category text,
  rank integer,
  user_id uuid,
  user_display_name text,
  user_photo_url text,
  user_home_club text,
  value numeric,
  attained_at timestamp with time zone,
  is_self boolean,
  total_count_in_category integer,
  rank_30d integer,
  delta integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH cats AS (
    SELECT DISTINCT
      cl.category,
      CASE WHEN cl.category LIKE 'lowest_gross%' OR cl.category LIKE 'best_score_diff%'
           THEN 'asc' ELSE 'desc' END AS dir,
      (cl.category LIKE '%\_90d' ESCAPE '\') AS is_90d
    FROM public.gam_course_legends cl
    WHERE cl.course_id = p_course_id
  ),
  raw AS (
    SELECT cl.category, cl.user_id, cl.value, cl.attained_at
    FROM public.gam_course_legends cl
    WHERE cl.course_id = p_course_id
  ),
  best_now AS (
    SELECT
      c.category,
      r.user_id,
      CASE WHEN c.dir = 'asc' THEN MIN(r.value) ELSE MAX(r.value) END AS best_val
    FROM cats c
    JOIN raw r ON r.category = c.category
    WHERE (NOT c.is_90d) OR r.attained_at >= (now() - interval '90 days')
    GROUP BY c.category, r.user_id, c.dir
  ),
  rank_now_calc AS (
    SELECT
      bn.category,
      bn.user_id,
      RANK() OVER (
        PARTITION BY bn.category
        ORDER BY
          CASE WHEN c.dir = 'asc'  THEN bn.best_val END ASC  NULLS LAST,
          CASE WHEN c.dir = 'desc' THEN bn.best_val END DESC NULLS LAST
      ) AS rnk
    FROM best_now bn
    JOIN cats c ON c.category = bn.category
  ),
  best_30d AS (
    SELECT
      c.category,
      r.user_id,
      CASE WHEN c.dir = 'asc' THEN MIN(r.value) ELSE MAX(r.value) END AS best_val
    FROM cats c
    JOIN raw r ON r.category = c.category
    WHERE r.attained_at <= (now() - interval '30 days')
      AND ((NOT c.is_90d) OR r.attained_at >= (now() - interval '120 days'))
    GROUP BY c.category, r.user_id, c.dir
  ),
  rank_30d_calc AS (
    SELECT
      b.category,
      b.user_id,
      RANK() OVER (
        PARTITION BY b.category
        ORDER BY
          CASE WHEN c.dir = 'asc'  THEN b.best_val END ASC  NULLS LAST,
          CASE WHEN c.dir = 'desc' THEN b.best_val END DESC NULLS LAST
      ) AS rnk
    FROM best_30d b
    JOIN cats c ON c.category = b.category
  ),
  base AS (
    SELECT
      cl.category,
      cl.rank,
      cl.user_id,
      up.display_name AS user_display_name,
      up.profile_photo_url AS user_photo_url,
      up.home_club AS user_home_club,
      cl.value,
      cl.attained_at,
      (cl.user_id = p_viewer_id) AS is_self,
      up.champions_visibility AS champions_visibility,
      COUNT(*) OVER (PARTITION BY cl.category)::int AS total_count_in_category,
      rn.rnk  AS rank_now_calc,
      r30.rnk AS rank_30d_val
    FROM public.gam_course_legends cl
    JOIN public.user_profiles up ON up.id = cl.user_id
    LEFT JOIN rank_now_calc rn  ON rn.category  = cl.category AND rn.user_id  = cl.user_id
    LEFT JOIN rank_30d_calc r30 ON r30.category = cl.category AND r30.user_id = cl.user_id
    WHERE cl.course_id = p_course_id
      AND cl.is_current = true
  )
  SELECT
    b.category,
    b.rank,
    b.user_id,
    b.user_display_name,
    b.user_photo_url,
    b.user_home_club,
    b.value,
    b.attained_at,
    b.is_self,
    b.total_count_in_category,
    b.rank_30d_val AS rank_30d,
    CASE
      WHEN b.rank_30d_val IS NULL THEN NULL
      ELSE (b.rank_30d_val - COALESCE(b.rank_now_calc, b.rank))
    END AS delta
  FROM base b
  WHERE
    b.is_self
    OR COALESCE(b.champions_visibility, 'everyone') = 'everyone'
    OR (b.champions_visibility = 'friends' AND public.are_friends(p_viewer_id, b.user_id))
  ORDER BY b.category, b.rank;
$function$;

GRANT EXECUTE ON FUNCTION public.get_course_legends(uuid, uuid)
  TO authenticated, service_role;
