-- ============================================
-- COURSES TAB REDESIGN - Database Phase
-- ============================================

-- 1. Create course_rank_history table for tracking rank changes
CREATE TABLE IF NOT EXISTS course_rank_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES golf_courses(id) ON DELETE CASCADE,
  rank_type text NOT NULL,  -- 'most_played', 'highest_rated', 'trending'
  rank integer NOT NULL,
  time_period text NOT NULL,  -- 'all_time', 'this_season', 'this_month'
  recorded_date date NOT NULL DEFAULT CURRENT_DATE,  -- Use date column instead of casting
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, rank_type, time_period, recorded_date)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_course_rank_history_lookup 
ON course_rank_history(course_id, rank_type, time_period, recorded_at DESC);

-- Enable RLS
ALTER TABLE course_rank_history ENABLE ROW LEVEL SECURITY;

-- Allow all to read rank history
CREATE POLICY "Anyone can view course rank history" 
ON course_rank_history FOR SELECT USING (true);

-- 2. Create course_prestige_tags table for special course awards
CREATE TABLE IF NOT EXISTS course_prestige_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES golf_courses(id) ON DELETE CASCADE,
  tag_type text NOT NULL,  -- 'hall_of_fame', 'top_10_worldwide', 'fan_favourite', 'fastest_rising', 'season_winner'
  tag_label text NOT NULL,  -- Display text
  awarded_at timestamptz NOT NULL DEFAULT now(),
  season_id uuid REFERENCES championship_seasons(id),  -- For season-specific tags
  metadata jsonb  -- Additional data
);

-- Create unique index that handles NULL season_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_course_prestige_unique 
ON course_prestige_tags(course_id, tag_type, COALESCE(season_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Index for prestige tag lookups
CREATE INDEX IF NOT EXISTS idx_course_prestige_tags_course 
ON course_prestige_tags(course_id);

-- Enable RLS
ALTER TABLE course_prestige_tags ENABLE ROW LEVEL SECURITY;

-- Allow all to read prestige tags
CREATE POLICY "Anyone can view course prestige tags" 
ON course_prestige_tags FOR SELECT USING (true);

-- 3. Update get_top100_course_leaderboard RPC with new fields
CREATE OR REPLACE FUNCTION get_top100_course_leaderboard(
  scope_param text DEFAULT 'worldwide',
  time_range_param text DEFAULT 'all_time',
  sort_param text DEFAULT 'most_played',
  limit_param integer DEFAULT 20,
  offset_param integer DEFAULT 0,
  current_user_id uuid DEFAULT NULL
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
  shortlisted_by_me boolean,
  -- New fields
  unique_players bigint,
  rank bigint,
  previous_rank bigint,
  rank_change integer,
  is_trending boolean,
  is_hall_of_fame boolean,
  season_wins integer,
  prestige_tags text[],
  current_user_played boolean,
  current_user_rating numeric,
  current_user_play_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Use provided user ID or fall back to auth.uid()
  v_user_id := COALESCE(current_user_id, auth.uid());

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
        WHEN gc.usa_rank IS NOT NULL THEN 'usa'
        WHEN gc.regional_rank IS NOT NULL THEN 'gb-i'
        ELSE 'worldwide'
      END AS list_slug
    FROM golf_courses gc
    WHERE gc.global_rank IS NOT NULL
       OR gc.regional_rank IS NOT NULL
       OR gc.usa_rank IS NOT NULL
  ),
  my_friends AS (
    SELECT
      CASE
        WHEN uf.user_id = v_user_id THEN uf.friend_id
        WHEN uf.friend_id = v_user_id THEN uf.user_id
      END AS friend_id
    FROM user_friends uf
    WHERE (uf.user_id = v_user_id OR uf.friend_id = v_user_id)
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
      COUNT(DISTINCT cr.id) AS times_played,
      COUNT(DISTINCT cr.user_id) AS unique_players,
      AVG(cr.rating)::numeric(3,1) AS avg_rating,
      COUNT(DISTINCT CASE WHEN cr.user_id IN (SELECT friend_id FROM my_friends) THEN cr.user_id END) AS friends_count,
      AVG(CASE WHEN cr.user_id IN (SELECT friend_id FROM my_friends) THEN cr.rating END)::numeric(3,1) AS friends_avg_rating,
      -- User-specific data
      bool_or(cr.user_id = v_user_id) AS current_user_played,
      (SELECT rating FROM course_ratings WHERE course_id = tc.id AND user_id = v_user_id ORDER BY created_at DESC LIMIT 1) AS current_user_rating,
      (SELECT COUNT(*)::integer FROM course_ratings WHERE course_id = tc.id AND user_id = v_user_id) AS current_user_play_count
    FROM top100_courses tc
    LEFT JOIN course_ratings cr
      ON cr.course_id = tc.id
      AND cr.is_mock = false
      AND (
        time_range_param = 'all_time'
        OR (time_range_param = 'this_year' AND cr.created_at >= date_trunc('year', now()))
        OR (time_range_param = 'this_month' AND cr.created_at >= date_trunc('month', now()))
        OR (time_range_param = 'this_season' AND cr.created_at >= COALESCE(
          (SELECT start_date FROM championship_seasons WHERE status = 'active' LIMIT 1),
          date_trunc('year', now())
        ))
      )
    WHERE
      CASE 
        WHEN scope_param = 'worldwide' THEN true
        WHEN scope_param = 'global-top-100' THEN tc.global_rank IS NOT NULL AND tc.global_rank <= 100
        WHEN scope_param = 'gb-i-top-100' THEN tc.regional_rank IS NOT NULL AND tc.regional_rank <= 100 
          AND tc.country IN ('United Kingdom','Ireland','England','Scotland','Wales','Northern Ireland')
        WHEN scope_param = 'usa-top-100' THEN tc.usa_rank IS NOT NULL AND tc.usa_rank <= 100
        WHEN scope_param = 'europe-top-100' THEN tc.regional_rank IS NOT NULL AND tc.regional_rank <= 100 
          AND tc.continent = 'Europe' 
          AND tc.country NOT IN ('United Kingdom','Ireland','England','Scotland','Wales','Northern Ireland')
        ELSE true
      END
    GROUP BY tc.id, tc.name, tc.country, tc.sub_country, tc.thumbnail_image, 
             tc.global_rank, tc.regional_rank, tc.usa_rank, tc.list_slug
  ),
  shortlist_counts AS (
    SELECT
      cs.course_id,
      COUNT(*) AS shortlisted_count,
      bool_or(cs.user_id = v_user_id) AS shortlisted_by_me
    FROM course_shortlists cs
    GROUP BY cs.course_id
  ),
  with_ranks AS (
    SELECT 
      cs.*,
      COALESCE(sc.shortlisted_count, 0) AS shortlisted_count,
      COALESCE(sc.shortlisted_by_me, false) AS shortlisted_by_me,
      ROW_NUMBER() OVER (
        ORDER BY 
          CASE sort_param
            WHEN 'most_played' THEN cs.times_played
            WHEN 'highest_rated' THEN (cs.avg_rating * 1000000)::bigint
            WHEN 'trending' THEN (COALESCE(cs.avg_rating, 0) / NULLIF(LOG(GREATEST(cs.times_played, 1) + 1), 0) * 1000000)::bigint
            WHEN 'rising' THEN (COALESCE(cs.avg_rating, 0) / NULLIF(LOG(GREATEST(cs.times_played, 1) + 1), 0) * 1000000)::bigint
            WHEN 'friends' THEN cs.friends_count
            ELSE cs.times_played
          END DESC NULLS LAST,
          cs.name ASC
      ) AS computed_rank,
      -- Get previous rank from history (yesterday or last recorded)
      (SELECT crh.rank FROM course_rank_history crh 
       WHERE crh.course_id = cs.id 
       AND crh.rank_type = sort_param 
       AND crh.time_period = time_range_param
       AND crh.recorded_date < CURRENT_DATE
       ORDER BY crh.recorded_at DESC LIMIT 1) AS previous_rank
    FROM course_stats cs
    LEFT JOIN shortlist_counts sc ON sc.course_id = cs.id
  ),
  with_prestige AS (
    SELECT 
      wr.*,
      (COALESCE(wr.previous_rank, wr.computed_rank)::integer - wr.computed_rank::integer) AS rank_change,
      ((COALESCE(wr.previous_rank, wr.computed_rank)::integer - wr.computed_rank::integer) >= 5) AS is_trending,
      EXISTS(SELECT 1 FROM course_prestige_tags cpt WHERE cpt.course_id = wr.id AND cpt.tag_type = 'hall_of_fame') AS is_hall_of_fame,
      (SELECT COUNT(*)::integer FROM course_prestige_tags cpt WHERE cpt.course_id = wr.id AND cpt.tag_type = 'season_winner') AS season_wins,
      ARRAY(SELECT cpt.tag_label FROM course_prestige_tags cpt WHERE cpt.course_id = wr.id ORDER BY cpt.awarded_at DESC LIMIT 2) AS prestige_tags
    FROM with_ranks wr
  )
  SELECT
    wp.id AS course_id,
    wp.name AS course_name,
    wp.country,
    wp.sub_country,
    wp.thumbnail_image AS thumbnail_url,
    wp.list_slug,
    wp.times_played,
    wp.avg_rating,
    wp.global_rank,
    wp.regional_rank,
    wp.usa_rank,
    wp.friends_count,
    wp.friends_avg_rating,
    wp.shortlisted_count,
    wp.shortlisted_by_me,
    wp.unique_players,
    wp.computed_rank AS rank,
    wp.previous_rank,
    wp.rank_change,
    wp.is_trending,
    wp.is_hall_of_fame,
    wp.season_wins,
    wp.prestige_tags,
    COALESCE(wp.current_user_played, false) AS current_user_played,
    wp.current_user_rating,
    COALESCE(wp.current_user_play_count, 0) AS current_user_play_count
  FROM with_prestige wp
  WHERE (sort_param != 'friends' OR wp.friends_count > 0)
  ORDER BY wp.computed_rank
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;

-- 4. Create get_course_hall_of_fame RPC
CREATE OR REPLACE FUNCTION get_course_hall_of_fame()
RETURNS TABLE (
  course_id uuid,
  course_name text,
  location text,
  thumbnail_url text,
  lifetime_plays bigint,
  lifetime_avg_rating numeric,
  season_wins integer,
  hall_of_fame_category text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Most Played (Top 3)
  (
    SELECT 
      gc.id,
      gc.name,
      COALESCE(gc.sub_country, gc.country) AS location,
      gc.thumbnail_image,
      COUNT(cr.id) AS lifetime_plays,
      ROUND(AVG(cr.rating), 1) AS lifetime_avg_rating,
      (SELECT COUNT(*)::integer FROM course_prestige_tags WHERE course_id = gc.id AND tag_type = 'season_winner'),
      'most_played'::text
    FROM golf_courses gc
    LEFT JOIN course_ratings cr ON gc.id = cr.course_id AND cr.is_mock = false
    WHERE gc.global_rank IS NOT NULL 
       OR gc.regional_rank IS NOT NULL 
       OR gc.usa_rank IS NOT NULL
    GROUP BY gc.id, gc.name, gc.country, gc.sub_country, gc.thumbnail_image
    ORDER BY COUNT(cr.id) DESC
    LIMIT 3
  )
  UNION ALL
  -- Highest Rated (Top 3, min 5 ratings)
  (
    SELECT 
      gc.id,
      gc.name,
      COALESCE(gc.sub_country, gc.country) AS location,
      gc.thumbnail_image,
      COUNT(cr.id) AS lifetime_plays,
      ROUND(AVG(cr.rating), 1) AS lifetime_avg_rating,
      (SELECT COUNT(*)::integer FROM course_prestige_tags WHERE course_id = gc.id AND tag_type = 'season_winner'),
      'highest_rated'::text
    FROM golf_courses gc
    LEFT JOIN course_ratings cr ON gc.id = cr.course_id AND cr.is_mock = false
    WHERE gc.global_rank IS NOT NULL 
       OR gc.regional_rank IS NOT NULL 
       OR gc.usa_rank IS NOT NULL
    GROUP BY gc.id, gc.name, gc.country, gc.sub_country, gc.thumbnail_image
    HAVING COUNT(cr.id) >= 5
    ORDER BY AVG(cr.rating) DESC
    LIMIT 3
  );
END;
$$;