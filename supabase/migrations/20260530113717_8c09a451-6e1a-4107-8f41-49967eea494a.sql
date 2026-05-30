CREATE OR REPLACE FUNCTION public.get_rival_crowns(p_user_id uuid)
RETURNS TABLE (
  rival_key          text,
  lowest_gross_you   integer,
  lowest_gross_them  integer,
  birdies_you        integer,
  birdies_them       integer,
  eagles_you         integer,
  eagles_them        integer,
  aces_you           integer,
  aces_them          integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH owner_conn AS (
    SELECT id AS connection_id
    FROM whs_connections
    WHERE user_id = p_user_id
      AND provider = 'england_golf'
      AND deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
  ),
  rivals AS (
    SELECT
      COALESCE(fr.rival_user_id::text, fr.rival_friend_row_id::text) AS rival_key,
      COALESCE(
        (SELECT wc.id
           FROM whs_connections wc
          WHERE wc.user_id = fr.rival_user_id
            AND wc.provider = 'england_golf'
            AND wc.deleted_at IS NULL
          ORDER BY wc.created_at DESC
          LIMIT 1),
        (SELECT fm.friend_connection_id
           FROM whs_friend_matches fm
          WHERE fm.owner_user_id = p_user_id
            AND fm.friend_row_id = fr.rival_friend_row_id
          LIMIT 1)
      ) AS rival_conn_id
    FROM friend_rivalry fr
    WHERE fr.user_id = p_user_id
      AND COALESCE(fr.rival_user_id::text, fr.rival_friend_row_id::text) IS NOT NULL
  ),
  shared AS (
    SELECT
      r.rival_key,
      ys.id  AS your_score_id,
      ts.id  AS their_score_id,
      ys.adjusted_gross AS your_gross,
      ts.adjusted_gross AS their_gross,
      ys.total_holes    AS your_holes,
      ts.total_holes    AS their_holes
    FROM rivals r
    CROSS JOIN owner_conn oc
    JOIN whs_scores ys
      ON ys.connection_id = oc.connection_id
    JOIN whs_scores ts
      ON ts.connection_id = r.rival_conn_id
     AND ts.play_date     = ys.play_date
     AND ts.course_id     = ys.course_id
    WHERE r.rival_conn_id IS NOT NULL
  ),
  hole_stats AS (
    SELECT
      h.score_id,
      COUNT(*) FILTER (
        WHERE h.played
          AND h.actual_gross IS NOT NULL
          AND h.par IS NOT NULL
          AND (h.actual_gross - h.par) = -1
      )::int AS birdies,
      COUNT(*) FILTER (
        WHERE h.played
          AND h.actual_gross IS NOT NULL
          AND h.par IS NOT NULL
          AND (h.actual_gross - h.par) <= -2
          AND h.actual_gross > 1
      )::int AS eagles,
      COUNT(*) FILTER (
        WHERE h.played
          AND h.actual_gross = 1
      )::int AS aces
    FROM whs_score_holes h
    WHERE h.score_id IN (
      SELECT your_score_id FROM shared
      UNION
      SELECT their_score_id FROM shared
    )
    GROUP BY h.score_id
  )
  SELECT
    s.rival_key,
    (MIN(s.your_gross)  FILTER (WHERE s.your_holes = 18))::int  AS lowest_gross_you,
    (MIN(s.their_gross) FILTER (WHERE s.their_holes = 18))::int AS lowest_gross_them,
    COALESCE(SUM(yh.birdies), 0)::int AS birdies_you,
    COALESCE(SUM(th.birdies), 0)::int AS birdies_them,
    COALESCE(SUM(yh.eagles),  0)::int AS eagles_you,
    COALESCE(SUM(th.eagles),  0)::int AS eagles_them,
    COALESCE(SUM(yh.aces),    0)::int AS aces_you,
    COALESCE(SUM(th.aces),    0)::int AS aces_them
  FROM shared s
  LEFT JOIN hole_stats yh ON yh.score_id = s.your_score_id
  LEFT JOIN hole_stats th ON th.score_id = s.their_score_id
  GROUP BY s.rival_key;
$$;

GRANT EXECUTE ON FUNCTION public.get_rival_crowns(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_rival_crowns(uuid) TO service_role;