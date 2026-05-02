CREATE OR REPLACE VIEW public.whs_friend_window_rankings AS
WITH
  ranked_scores AS (
    SELECT
      s.connection_id,
      s.play_date,
      s.handicap_differential,
      ROW_NUMBER() OVER (
        PARTITION BY s.connection_id
        ORDER BY s.play_date DESC, s.id DESC
      ) AS recent_rank
    FROM public.whs_scores s
    WHERE s.handicap_differential IS NOT NULL
  ),
  this_year AS (
    SELECT
      connection_id,
      AVG(handicap_differential) AS avg_diff,
      COUNT(*) AS round_count
    FROM public.whs_scores
    WHERE handicap_differential IS NOT NULL
      AND play_date >= date_trunc('year', now())
    GROUP BY connection_id
  ),
  this_month AS (
    SELECT
      connection_id,
      AVG(handicap_differential) AS avg_diff,
      COUNT(*) AS round_count
    FROM public.whs_scores
    WHERE handicap_differential IS NOT NULL
      AND play_date >= date_trunc('month', now())
    GROUP BY connection_id
  ),
  last_8 AS (
    SELECT
      connection_id,
      AVG(handicap_differential) AS avg_diff,
      COUNT(*) AS round_count
    FROM ranked_scores
    WHERE recent_rank <= 8
    GROUP BY connection_id
  )
SELECT
  fm.owner_user_id,
  fm.friend_row_id,
  fm.friend_connection_id,
  ty.avg_diff       AS this_year_avg_diff,
  ty.round_count    AS this_year_rounds,
  tm.avg_diff       AS this_month_avg_diff,
  tm.round_count    AS this_month_rounds,
  l8.avg_diff       AS last_8_avg_diff,
  l8.round_count    AS last_8_rounds
FROM public.whs_friend_matches fm
LEFT JOIN this_year  ty ON ty.connection_id = fm.friend_connection_id
LEFT JOIN this_month tm ON tm.connection_id = fm.friend_connection_id
LEFT JOIN last_8     l8 ON l8.connection_id = fm.friend_connection_id
WHERE fm.friend_connection_id IS NOT NULL;

GRANT SELECT ON public.whs_friend_window_rankings TO authenticated;