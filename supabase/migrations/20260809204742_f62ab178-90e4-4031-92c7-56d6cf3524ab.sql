CREATE OR REPLACE FUNCTION public.find_golfers_v1(p_query text DEFAULT NULL, p_limit int DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_q text := nullif(btrim(coalesce(p_query, '')), '');
  v_limit int := least(greatest(coalesce(p_limit, 30), 1), 60);
  v_total int;
  v_rows jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('total_members', 0, 'members', '[]'::jsonb);
  END IF;

  SELECT count(*) INTO v_total
  FROM user_profiles up
  WHERE up.id <> v_uid
    AND coalesce(up.is_suspended, false) = false
    AND up.deleted_at IS NULL;

  WITH blocked AS (
    SELECT blocked_id AS uid FROM user_blocks WHERE blocker_id = v_uid
    UNION SELECT blocker_id FROM user_blocks WHERE blocked_id = v_uid
  ),
  mine AS (SELECT following_id FROM user_follows WHERE follower_id = v_uid),
  ranked AS (
    SELECT DISTINCT ON (rk.uid) rk.uid, rk.reason_type, rk.reason_detail, rk.score
    FROM (
      SELECT uf2.following_id AS uid, 'followed_by' AS reason_type,
             min(up1.display_name) AS reason_detail, count(*) + 1000 AS score
      FROM mine m
      JOIN user_follows uf2 ON uf2.follower_id = m.following_id
      JOIN user_profiles up1 ON up1.id = m.following_id
      WHERE uf2.following_id <> v_uid
        AND uf2.following_id NOT IN (SELECT uid FROM blocked)
      GROUP BY uf2.following_id
      UNION ALL
      SELECT cr2.user_id, 'plays', min(gc.name), count(*) + 500
      FROM course_ratings cr1
      JOIN course_ratings cr2 ON cr2.course_id = cr1.course_id AND cr2.user_id <> v_uid
      JOIN golf_courses gc ON gc.id = cr1.course_id
      WHERE cr1.user_id = v_uid
        AND cr2.user_id NOT IN (SELECT uid FROM blocked)
      GROUP BY cr2.user_id
      UNION ALL
      SELECT uf.following_id, 'popular', NULL, count(*)
      FROM user_follows uf
      WHERE uf.following_id <> v_uid
        AND uf.following_id NOT IN (SELECT uid FROM blocked)
      GROUP BY uf.following_id
      UNION ALL
      SELECT up2.id, 'popular', NULL, 0
      FROM user_profiles up2
      WHERE up2.id <> v_uid
        AND up2.id NOT IN (SELECT uid FROM blocked)
    ) rk
    ORDER BY rk.uid, rk.score DESC
  ),
  picked AS (
    SELECT r.uid, r.reason_type, r.reason_detail, r.score, up.display_name,
           up.username, up.profile_photo_url, up.home_club,
           CASE WHEN can_view_handicap(v_uid, up.id)
                THEN coalesce(up.eg_handicap_index, up.manual_handicap_index)
                ELSE NULL END AS handicap_index
    FROM ranked r
    JOIN user_profiles up ON up.id = r.uid
    WHERE coalesce(up.is_suspended, false) = false
      AND up.deleted_at IS NULL
      AND (
        v_q IS NULL
        OR up.display_name ILIKE '%' || v_q || '%'
        OR up.username ILIKE '%' || v_q || '%'
      )
    ORDER BY CASE WHEN v_q IS NULL THEN 0 ELSE 1 END,
             CASE WHEN v_q IS NULL THEN NULL ELSE lower(coalesce(up.display_name, up.username)) END,
             r.score DESC
    LIMIT v_limit
  )
  SELECT coalesce(jsonb_agg(row_to_json(o)), '[]'::jsonb) INTO v_rows
  FROM (
    SELECT p.uid AS id, p.display_name, p.username, p.profile_photo_url,
           CASE WHEN v_q IS NULL THEN p.reason_type ELSE 'match' END AS reason_type,
           CASE WHEN v_q IS NULL THEN p.reason_detail ELSE NULL END AS reason_detail,
           p.handicap_index, p.home_club,
           (SELECT count(*) FROM gam_round_stats g
             WHERE g.user_id = p.uid AND g.holes_played = 18) AS rounds_tracked,
           EXISTS (SELECT 1 FROM user_friends f WHERE f.status = 'accepted'
                   AND ((f.user_id = v_uid AND f.friend_id = p.uid)
                     OR (f.user_id = p.uid AND f.friend_id = v_uid))) AS is_friend,
           EXISTS (SELECT 1 FROM user_friends f WHERE f.status = 'pending'
                   AND f.user_id = v_uid AND f.friend_id = p.uid) AS friend_pending,
           EXISTS (SELECT 1 FROM user_friends f WHERE f.status = 'pending'
                   AND f.user_id = p.uid AND f.friend_id = v_uid) AS friend_incoming,
           EXISTS (SELECT 1 FROM user_follows uf
                   WHERE uf.follower_id = v_uid AND uf.following_id = p.uid) AS is_following,
           p.score
    FROM picked p
    ORDER BY p.score DESC, lower(coalesce(p.display_name, p.username))
  ) o;

  RETURN jsonb_build_object('total_members', v_total, 'members', v_rows);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.find_golfers_v1(text, int) TO authenticated;
REVOKE ALL ON FUNCTION public.find_golfers_v1(text, int) FROM anon;