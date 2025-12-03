-- Phase 3A: Trip Shortlist table and RPC update

-- 3A.1: Create course_shortlists table
CREATE TABLE IF NOT EXISTS public.course_shortlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES golf_courses (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  list_key text DEFAULT 'default'
);

-- One shortlist entry per course per user
CREATE UNIQUE INDEX IF NOT EXISTS course_shortlists_user_course_key
  ON public.course_shortlists (user_id, course_id);

-- Enable RLS
ALTER TABLE public.course_shortlists ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own shortlist"
ON public.course_shortlists
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to shortlist"
ON public.course_shortlists
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from shortlist"
ON public.course_shortlists
FOR DELETE
USING (auth.uid() = user_id);

-- 3A.2: Update get_top100_course_leaderboard RPC to include shortlist data
DROP FUNCTION IF EXISTS public.get_top100_course_leaderboard(text, text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_top100_course_leaderboard(
  scope_param text DEFAULT 'worldwide',
  time_range_param text DEFAULT 'all_time',
  limit_param integer DEFAULT 20,
  offset_param integer DEFAULT 0
)
RETURNS TABLE (
  course_id uuid,
  course_name text,
  country text,
  sub_country text,
  thumbnail_url text,
  list_slug text,
  times_played bigint,
  avg_rating numeric,
  global_rank integer,
  regional_rank integer,
  usa_rank integer,
  friends_count bigint,
  friends_avg_rating numeric,
  shortlisted_count bigint,
  shortlisted_by_me boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH top100_courses AS (
    SELECT
      gc.id,
      gc.name,
      gc.country,
      gc.sub_country,
      gc.thumbnail_image,
      gc.global_rank,
      gc.regional_rank,
      gc.usa_rank,
      gc.continent,
      CASE
        WHEN gc.global_rank IS NOT NULL THEN 'global'
        WHEN gc.usa_rank    IS NOT NULL THEN 'usa'
        WHEN gc.regional_rank IS NOT NULL THEN 'gb-i'
        ELSE 'worldwide'
      END AS list_slug
    FROM golf_courses gc
    WHERE gc.global_rank   IS NOT NULL
       OR gc.regional_rank IS NOT NULL
       OR gc.usa_rank      IS NOT NULL
  ),
  my_friends AS (
    SELECT
      CASE
        WHEN uf.user_id = auth.uid()   THEN uf.friend_id
        WHEN uf.friend_id = auth.uid() THEN uf.user_id
      END AS friend_id
    FROM user_friends uf
    WHERE (uf.user_id = auth.uid() OR uf.friend_id = auth.uid())
      AND uf.status = 'accepted'
  ),
  course_stats AS (
    SELECT 
      tc.id,
      tc.name,
      tc.country,
      tc.sub_country,
      tc.thumbnail_image,
      tc.global_rank,
      tc.regional_rank,
      tc.usa_rank,
      tc.list_slug,
      COUNT(DISTINCT cr.user_id) AS times_played,
      AVG(cr.rating)::numeric(3,1) AS avg_rating,
      COUNT(DISTINCT CASE WHEN cr.user_id IN (SELECT friend_id FROM my_friends) THEN cr.user_id END) AS friends_count,
      AVG(CASE WHEN cr.user_id IN (SELECT friend_id FROM my_friends) THEN cr.rating END)::numeric(3,1) AS friends_avg_rating
    FROM top100_courses tc
    LEFT JOIN course_ratings cr
      ON cr.course_id = tc.id
      AND (
        time_range_param = 'all_time'
        OR (time_range_param = 'this_year'  AND cr.created_at >= date_trunc('year',  now()))
        OR (time_range_param = 'this_month' AND cr.created_at >= date_trunc('month', now()))
        OR (time_range_param = 'this_week'  AND cr.created_at >= date_trunc('week',  now()))
      )
    WHERE
      CASE 
        WHEN scope_param = 'worldwide' THEN (tc.global_rank IS NOT NULL OR tc.regional_rank IS NOT NULL OR tc.usa_rank IS NOT NULL)
        WHEN scope_param = 'global-top-100' THEN tc.global_rank IS NOT NULL AND tc.global_rank <= 100
        WHEN scope_param = 'gb-i-top-100' THEN tc.regional_rank IS NOT NULL AND tc.regional_rank <= 100 AND tc.country IN ('United Kingdom','Ireland','England','Scotland','Wales','Northern Ireland')
        WHEN scope_param = 'usa-top-100' THEN tc.usa_rank IS NOT NULL AND tc.usa_rank <= 100
        WHEN scope_param = 'europe-top-100' THEN tc.regional_rank IS NOT NULL AND tc.regional_rank <= 100 AND tc.continent = 'Europe' AND tc.country NOT IN ('United Kingdom','Ireland','England','Scotland','Wales','Northern Ireland')
        ELSE (tc.global_rank IS NOT NULL OR tc.regional_rank IS NOT NULL OR tc.usa_rank IS NOT NULL)
      END
    GROUP BY
      tc.id, tc.name, tc.country, tc.sub_country,
      tc.thumbnail_image, tc.global_rank, tc.regional_rank,
      tc.usa_rank, tc.list_slug
  ),
  shortlist_counts AS (
    SELECT
      cs.course_id,
      COUNT(*) AS shortlisted_count,
      bool_or(cs.user_id = auth.uid()) AS shortlisted_by_me
    FROM course_shortlists cs
    GROUP BY cs.course_id
  )
  SELECT
    cs.id                  AS course_id,
    cs.name                AS course_name,
    cs.country,
    cs.sub_country,
    cs.thumbnail_image     AS thumbnail_url,
    cs.list_slug,
    cs.times_played,
    cs.avg_rating,
    cs.global_rank,
    cs.regional_rank,
    cs.usa_rank,
    cs.friends_count,
    cs.friends_avg_rating,
    COALESCE(sc.shortlisted_count, 0) AS shortlisted_count,
    COALESCE(sc.shortlisted_by_me, false) AS shortlisted_by_me
  FROM course_stats cs
  LEFT JOIN shortlist_counts sc ON sc.course_id = cs.id
  ORDER BY 
    CASE 
      WHEN scope_param = 'global-top-100' THEN cs.global_rank
      WHEN scope_param = 'gb-i-top-100'   THEN cs.regional_rank
      WHEN scope_param = 'usa-top-100'    THEN cs.usa_rank
      WHEN scope_param = 'europe-top-100' THEN cs.regional_rank
      ELSE COALESCE(cs.global_rank, cs.regional_rank, cs.usa_rank, 9999)
    END ASC NULLS LAST
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;