CREATE OR REPLACE FUNCTION public.get_watch_shorts_v2(p_user_id uuid, p_mode text DEFAULT 'trending'::text, p_page_size integer DEFAULT 30, p_cursor timestamp with time zone DEFAULT NULL::timestamp with time zone, p_seen_ids uuid[] DEFAULT '{}'::uuid[], p_search_query text DEFAULT NULL::text, p_user_lat double precision DEFAULT NULL::double precision, p_user_lng double precision DEFAULT NULL::double precision, p_category text DEFAULT NULL::text, p_max_duration integer DEFAULT NULL::integer, p_viewer_actor_type text DEFAULT 'personal'::text, p_viewer_actor_id uuid DEFAULT NULL::uuid, p_filter text DEFAULT NULL::text)
 RETURNS TABLE(post_id uuid, post_content text, post_created_at timestamp with time zone, post_user_id uuid, post_actor_type text, post_actor_id uuid, post_status text, source_review_id uuid, media_id uuid, media_type text, media_url text, poster_url text, stream_id text, duration_seconds numeric, width integer, height integer, display_order integer, creator_username text, creator_display_name text, creator_avatar_url text, creator_is_verified boolean, business_name text, business_logo_url text, business_is_verified boolean, like_count bigint, comment_count bigint, share_count bigint, review_rating numeric, review_course_id uuid, review_course_name text, review_course_image text, course_region text, course_country text, creator_relation text, is_liked_by_me boolean, is_followed_by_me boolean, engagement_score numeric, review_design_score numeric, review_condition_score numeric, review_facilities_score numeric, review_clubhouse_score numeric, post_tags jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_max_duration INT := COALESCE(p_max_duration, 180);
  c_seen1 numeric; c_seen2 numeric; c_seen3 numeric;
  c_fy_w_fresh numeric; c_fy_w_eng numeric; c_fy_w_social numeric;
  c_fy_w_aff numeric; c_fy_w_proof numeric; c_fy_half_life numeric;
  c_fy_eng_scale numeric; c_fy_proof_hours numeric;
  v_viewer_actor_type TEXT := COALESCE(p_viewer_actor_type, 'personal');
  v_viewer_actor_id UUID := COALESCE(p_viewer_actor_id, p_user_id);
BEGIN
  SELECT COALESCE(MAX(CASE WHEN key = 'watch_clips_seen_1' THEN value END), 0.45),
         COALESCE(MAX(CASE WHEN key = 'watch_clips_seen_2' THEN value END), 0.20),
         COALESCE(MAX(CASE WHEN key = 'watch_clips_seen_3plus' THEN value END), 0.08),
         COALESCE(MAX(CASE WHEN key = 'watch_fy_w_fresh' THEN value END), 0.30),
         COALESCE(MAX(CASE WHEN key = 'watch_fy_w_eng' THEN value END), 0.25),
         COALESCE(MAX(CASE WHEN key = 'watch_fy_w_social' THEN value END), 0.20),
         COALESCE(MAX(CASE WHEN key = 'watch_fy_w_affinity' THEN value END), 0.15),
         COALESCE(MAX(CASE WHEN key = 'watch_fy_w_proof' THEN value END), 0.10),
         COALESCE(MAX(CASE WHEN key = 'watch_fy_half_life_hours' THEN value END), 24),
         COALESCE(MAX(CASE WHEN key = 'watch_fy_eng_scale' THEN value END), 1.0),
         COALESCE(MAX(CASE WHEN key = 'watch_fy_proof_window_hours' THEN value END), 72)
    INTO c_seen1, c_seen2, c_seen3,
         c_fy_w_fresh, c_fy_w_eng, c_fy_w_social, c_fy_w_aff, c_fy_w_proof,
         c_fy_half_life, c_fy_eng_scale, c_fy_proof_hours
    FROM feed_config;

  RETURN QUERY
  WITH
  blocked_users AS (
    SELECT blocked_id AS uid FROM user_blocks WHERE blocker_id = p_user_id
    UNION SELECT blocker_id AS uid FROM user_blocks WHERE blocked_id = p_user_id
  ),
  dismissed AS (
    SELECT pd.post_id AS pid FROM post_dismissals pd WHERE pd.user_id = p_user_id
  ),
  creator_dismissals AS (
    SELECT p2.user_id AS creator_uid, COUNT(*)::int AS dismiss_count
    FROM post_dismissals pd
    INNER JOIN posts p2 ON p2.id = pd.post_id
    WHERE pd.user_id = p_user_id
    GROUP BY p2.user_id
  ),
  my_follows AS (
    SELECT following_id AS uid FROM user_follows WHERE follower_id = p_user_id
  ),
  my_friends AS (
    SELECT friend_id AS uid FROM user_friends WHERE user_id = p_user_id AND status = 'accepted'
    UNION SELECT user_id AS uid FROM user_friends WHERE friend_id = p_user_id AND status = 'accepted'
  ),
  my_business_follows AS (
    SELECT business_id AS bid FROM business_follows WHERE follower_id = p_user_id
  ),
  my_played AS (
    SELECT DISTINCT uca0.course_id AS cid
    FROM user_course_activity uca0
    WHERE uca0.user_id = p_user_id AND uca0.has_played = true
  ),
  candidates AS (
    SELECT
      p.id AS p_id, p.content AS p_content, p.created_at AS p_created_at,
      p.user_id AS p_user_id, p.actor_type AS p_actor_type, p.actor_id AS p_actor_id,
      p.status AS p_status, p.source_review_id AS p_source_review_id,
      pm.id AS pm_id, pm.media_type AS pm_media_type, pm.media_url AS pm_media_url,
      pm.poster_url AS pm_poster_url, pm.stream_id AS pm_stream_id,
      pm.duration_seconds AS pm_duration, pm.width AS pm_width, pm.height AS pm_height,
      pm.display_order AS pm_display_order,
      COALESCE(plc.cnt, 0) AS p_like_count,
      COALESCE(pcc.cnt, 0) AS p_comment_count,
      COALESCE(psc.cnt, 0) AS p_share_count,
      cr.rating AS p_review_rating, gc.id AS p_review_course_id,
      gc.name AS p_review_course_name, gc.thumbnail_image AS p_review_course_image,
      gc.region AS p_course_region, gc.country AS p_course_country,
      cr.design_score AS p_review_design_score,
      cr.condition_score AS p_review_condition_score,
      cr.facilities_score AS p_review_facilities_score,
      cr.clubhouse_score AS p_review_clubhouse_score,
      up.username AS p_creator_username, up.display_name AS p_creator_display_name,
      up.profile_photo_url AS p_creator_avatar,
      COALESCE(up.is_verified, FALSE) AS p_creator_verified,
      ba.name AS p_business_name, ba.logo_url AS p_business_logo,
      COALESCE(ba.is_verified, FALSE) AS p_business_verified,
      CASE
        WHEN mfr.uid IS NOT NULL THEN 'friend'
        WHEN mfl.uid IS NOT NULL THEN 'following'
        WHEN mbf.bid IS NOT NULL AND p.actor_type = 'business' THEN 'following'
        ELSE 'none'
      END AS p_relation,
      public.viewer_liked_post(p.id, v_viewer_actor_id, v_viewer_actor_type) AS p_liked_by_me,
      CASE
        WHEN mfl.uid IS NOT NULL THEN TRUE
        WHEN mbf.bid IS NOT NULL AND p.actor_type = 'business' THEN TRUE
        ELSE FALSE
      END AS p_followed_by_me,
      GREATEST(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600, 0.1) AS hours_old,
      CASE
        WHEN COALESCE(cd.dismiss_count, 0) >= 3 THEN 0.40
        WHEN COALESCE(cd.dismiss_count, 0) = 2  THEN 0.70
        ELSE 1.00
      END AS creator_deprio,
      1.0::numeric AS creator_quality_factor,
      COALESCE(pi.impression_count, 0) AS seen_n
    FROM posts p
    LEFT JOIN post_impressions pi
      ON pi.user_id = p_user_id AND pi.post_id = p.id
    INNER JOIN post_media pm ON pm.post_id = p.id
    LEFT JOIN user_profiles up ON up.id = p.user_id
    LEFT JOIN business_accounts ba ON ba.id = p.actor_id AND p.actor_type = 'business'
    -- like_count is the denormalised INTEGER column on posts (it used to be a
    -- COUNT(*), which returns bigint). The RETURNS TABLE slot is still bigint,
    -- so without this explicit ::bigint the whole function fails at runtime with
    -- 42804 "Returned type integer does not match expected type bigint".
    -- The COALESCE guards the LEFT JOIN LATERAL matching no row, not a null
    -- column: posts.like_count is NOT NULL DEFAULT 0. The comment/share laterals
    -- below are still COUNT(*) and already return bigint — do not "fix" them.
    LEFT JOIN LATERAL (SELECT COALESCE(plq.like_count, 0)::bigint AS cnt FROM posts plq WHERE plq.id = p.id) plc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM comments_v2 cm WHERE cm.target_type = 'post' AND cm.target_id = p.id) pcc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_shares sh WHERE sh.post_id = p.id) psc ON TRUE
    LEFT JOIN my_friends mfr ON mfr.uid = p.user_id
    LEFT JOIN my_follows mfl ON mfl.uid = p.user_id
    LEFT JOIN my_business_follows mbf ON mbf.bid = p.actor_id AND p.actor_type = 'business'
    LEFT JOIN blocked_users bu ON bu.uid = p.user_id
    LEFT JOIN dismissed d ON d.pid = p.id
    LEFT JOIN post_likes ml ON ml.post_id = p.id AND ml.actor_type = v_viewer_actor_type AND ml.actor_id = v_viewer_actor_id
    LEFT JOIN course_ratings cr ON cr.id = p.source_review_id
    LEFT JOIN golf_courses gc ON gc.id = COALESCE(cr.course_id, p.course_id)
    LEFT JOIN creator_dismissals cd ON cd.creator_uid = p.user_id
    WHERE p.status = 'published'
      AND bu.uid IS NULL
      AND d.pid IS NULL
      AND pm.derived_format = 'clip'
      AND pm.processing_status = 'complete'
      AND pm.duration_seconds <= v_max_duration
      AND (p_cursor IS NULL OR p.created_at < p_cursor)
      AND NOT (p.id = ANY(p_seen_ids))
      AND (
        p_search_query IS NULL
        OR p.content ILIKE '%' || p_search_query || '%'
        OR gc.name ILIKE '%' || p_search_query || '%'
        OR up.display_name ILIKE '%' || p_search_query || '%'
        OR up.username ILIKE '%' || p_search_query || '%'
      )
      AND p.created_at > NOW() - INTERVAL '365 days'
      AND (
        p_mode != 'near'
        OR (
          p_user_lat IS NOT NULL AND p_user_lng IS NOT NULL
          AND gc.latitude IS NOT NULL AND gc.longitude IS NOT NULL
          AND gc.latitude BETWEEN (p_user_lat - 0.45) AND (p_user_lat + 0.45)
          AND gc.longitude BETWEEN (p_user_lng - 0.6) AND (p_user_lng + 0.6)
        )
      )
      AND (p_category IS NULL OR p.post_categories @> ARRAY[p_category])
      AND (
        p_filter IS NULL
        OR (p_filter = 'following' AND (
              p.user_id IN (SELECT following_id FROM user_follows WHERE follower_id = p_user_id)
              OR (p.actor_type = 'business' AND p.actor_id IN (SELECT business_id FROM business_follows WHERE follower_id = p_user_id))
           ))
        OR (p_filter = 'played_courses' AND COALESCE(cr.course_id, p.course_id) IN (
              SELECT DISTINCT uca.course_id FROM user_course_activity uca
              WHERE uca.user_id = p_user_id AND uca.has_played = true
           ))
      )
    ORDER BY p.created_at DESC
    LIMIT p_page_size * 3
  ),
  scored AS (
    SELECT c.*,
      CASE
        WHEN c.pm_duration BETWEEN 8 AND 180 THEN 1.00
        WHEN c.pm_duration BETWEEN 4 AND 7   THEN 0.50
        WHEN c.pm_duration BETWEEN 181 AND 300 THEN 0.50
        WHEN c.pm_duration < 4                THEN 0.20
        ELSE 0.20
      END AS duration_quality,
      CASE p_mode
        WHEN 'trending' THEN
          ((c.p_like_count * 1.0 + c.p_comment_count * 2.5 + c.p_share_count * 3.0) / c.hours_old)
          * CASE WHEN c.hours_old < 6 THEN 2.0 * (1.0 - c.hours_old / 6.0) ELSE 1.0 END
        WHEN 'latest' THEN EXTRACT(EPOCH FROM c.p_created_at)
        WHEN 'top' THEN
          (c.p_like_count * 1.0 + c.p_comment_count * 2.5 + c.p_share_count * 3.0)
          * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - c.p_created_at)) / 86400 / 30)
        WHEN 'near' THEN EXTRACT(EPOCH FROM c.p_created_at)
        WHEN 'for_you' THEN
          c_fy_w_fresh * POWER(0.5, c.hours_old / c_fy_half_life)
          + c_fy_w_eng * LEAST(1.0,
              (c.p_like_count * 1.0 + c.p_comment_count * 2.5 + c.p_share_count * 3.0)
              / c.hours_old / c_fy_eng_scale)
          + c_fy_w_social * CASE WHEN EXISTS (
              SELECT 1 FROM my_follows mfx WHERE mfx.uid = c.p_user_id
            ) OR EXISTS (
              SELECT 1 FROM my_friends mfr WHERE mfr.uid = c.p_user_id
            ) THEN 1.0 ELSE 0.0 END
          + c_fy_w_aff * CASE WHEN COALESCE(c.p_review_course_id, (
                SELECT p3.course_id FROM posts p3 WHERE p3.id = c.p_id
              )) IN (SELECT mp.cid FROM my_played mp)
            THEN 1.0 ELSE 0.0 END
          + c_fy_w_proof * CASE WHEN public.post_proof_liked(c.p_id, ARRAY(SELECT mfp.uid FROM my_follows mfp), NOW() - make_interval(hours => c_fy_proof_hours::integer)) THEN 1.0 ELSE 0.0 END
        ELSE 0
      END AS base_score
    FROM candidates c
  ),
  scored_final AS (
    SELECT s.*,
      (CASE p_mode
        WHEN 'trending' THEN s.base_score * s.duration_quality * s.creator_deprio * s.creator_quality_factor
        WHEN 'top'      THEN s.base_score * s.duration_quality * s.creator_deprio * s.creator_quality_factor
        WHEN 'for_you'  THEN s.base_score * s.duration_quality * s.creator_deprio * s.creator_quality_factor
        ELSE s.base_score * s.creator_deprio
      END)
      * CASE WHEN p_mode IN ('trending', 'top', 'for_you') THEN
          CASE s.seen_n WHEN 0 THEN 1.0 WHEN 1 THEN c_seen1 WHEN 2 THEN c_seen2 ELSE c_seen3 END
        ELSE 1.0 END AS score
    FROM scored s
  ),
  filtered AS (
    SELECT * FROM scored_final
    ORDER BY
      CASE WHEN p_mode IN ('latest', 'near') THEN (seen_n > 0)::int ELSE 0 END ASC,
      score DESC
    LIMIT p_page_size
  )
  SELECT
    f.p_id, f.p_content, f.p_created_at, f.p_user_id, f.p_actor_type, f.p_actor_id,
    f.p_status, f.p_source_review_id,
    f.pm_id, f.pm_media_type, f.pm_media_url, f.pm_poster_url, f.pm_stream_id,
    f.pm_duration, f.pm_width, f.pm_height, f.pm_display_order,
    f.p_creator_username, f.p_creator_display_name, f.p_creator_avatar, f.p_creator_verified,
    f.p_business_name, f.p_business_logo, f.p_business_verified,
    f.p_like_count, f.p_comment_count, f.p_share_count,
    f.p_review_rating, f.p_review_course_id, f.p_review_course_name, f.p_review_course_image,
    f.p_course_region, f.p_course_country,
    f.p_relation, f.p_liked_by_me, f.p_followed_by_me,
    f.score,
    f.p_review_design_score, f.p_review_condition_score,
    f.p_review_facilities_score, f.p_review_clubhouse_score,
    public.get_post_tags_jsonb(f.p_id)
  FROM filtered f
  ORDER BY
    CASE WHEN p_mode IN ('latest', 'near') THEN (f.seen_n > 0)::int ELSE 0 END ASC,
    f.score DESC;
END;
$function$