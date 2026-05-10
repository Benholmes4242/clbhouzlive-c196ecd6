DROP FUNCTION IF EXISTS public.get_friend_leaderboard(uuid);

CREATE OR REPLACE FUNCTION public.get_friend_leaderboard(p_user_id uuid)
 RETURNS TABLE(is_self boolean, friend_user_id uuid, friend_connection_id uuid, friend_passport_id bigint, friend_row_id uuid, friend_name text, friend_thumbnail_url text, friend_handicap_index numeric, friend_home_club text, last_round_played_at timestamp with time zone, last_round_course_name text, is_clbhouz_user boolean, handicap_30d_ago numeric, handicap_30d_delta numeric, rounds_last_30d integer)
 LANGUAGE sql
 STABLE
AS $function$
  WITH base AS (
    SELECT
      true AS is_self,
      up.id AS friend_user_id,
      wc.id AS friend_connection_id,
      wc.passport_id AS friend_passport_id,
      NULL::uuid AS friend_row_id,
      COALESCE(up.display_name, up.username, 'You') AS friend_name,
      up.profile_photo_url AS friend_thumbnail_url,
      up.eg_handicap_index AS friend_handicap_index,
      NULL::text AS friend_home_club,
      (
        SELECT MAX(ws.play_date)
        FROM whs_scores ws
        WHERE ws.connection_id = wc.id
      ) AS last_round_played_at,
      NULL::text AS last_round_course_name,
      true AS is_clbhouz_user
    FROM user_profiles up
    LEFT JOIN whs_connections wc ON wc.user_id = up.id
    WHERE up.id = p_user_id

    UNION ALL

    SELECT
      false AS is_self,
      fm.friend_user_id,
      fm.friend_connection_id,
      fm.friend_passport_id,
      fm.friend_row_id,
      fm.friend_name,
      fm.friend_thumbnail_url,
      fm.friend_handicap_index,
      fm.friend_home_club,
      fm.last_round_played_at,
      fm.last_round_course_name,
      fm.is_clbhouz_user
    FROM whs_friend_matches fm
    WHERE fm.owner_user_id = p_user_id
  )
  SELECT
    base.*,
    (
      SELECT s.handicap_index
      FROM whs_friend_handicap_snapshots s
      WHERE s.friend_passport_id = base.friend_passport_id
        AND s.snapshot_date <= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY s.snapshot_date DESC
      LIMIT 1
    ) AS handicap_30d_ago,
    CASE
      WHEN base.friend_handicap_index IS NULL THEN NULL
      ELSE base.friend_handicap_index - (
        SELECT s.handicap_index
        FROM whs_friend_handicap_snapshots s
        WHERE s.friend_passport_id = base.friend_passport_id
          AND s.snapshot_date <= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY s.snapshot_date DESC
        LIMIT 1
      )
    END AS handicap_30d_delta,
    COALESCE((
      SELECT COUNT(*)::int
      FROM whs_scores ws
      WHERE ws.connection_id = base.friend_connection_id
        AND ws.play_date >= (CURRENT_DATE - INTERVAL '30 days')
    ), 0) AS rounds_last_30d
  FROM base
  ORDER BY 8 NULLS LAST;
$function$;