-- Drop old signature (no actor params) and recreate with viewer-actor params.
DROP FUNCTION IF EXISTS public.get_suggested_feed_v2(uuid, integer, text, uuid[], text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric);

CREATE OR REPLACE FUNCTION public.get_suggested_feed_v2(
  p_user_id uuid,
  p_page_size integer DEFAULT 10,
  p_cursor text DEFAULT NULL::text,
  p_seen_post_ids uuid[] DEFAULT '{}'::uuid[],
  p_mode text DEFAULT 'suggested'::text,
  p_freshness_base numeric DEFAULT 100,
  p_freshness_half_life_hours numeric DEFAULT 36,
  p_engagement_per_like numeric DEFAULT 4,
  p_engagement_per_comment numeric DEFAULT 7,
  p_review_bonus numeric DEFAULT 2.0,
  p_entropy_floor numeric DEFAULT 0.82,
  p_entropy_range numeric DEFAULT 0.32,
  p_boost_followed numeric DEFAULT 1.50,
  p_boost_mutual_friends numeric DEFAULT 1.20,
  p_boost_country_match numeric DEFAULT 1.15,
  p_boost_top100_list numeric DEFAULT 1.25,
  p_boost_rated_course numeric DEFAULT 1.50,
  p_viewer_actor_type text DEFAULT 'personal'::text,
  p_viewer_actor_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(post_id uuid, post_content text, post_created_at timestamp with time zone, post_user_id uuid, post_actor_type text, post_actor_id uuid, post_status text, source_review_id uuid, media_id uuid, media_type text, media_url text, poster_url text, stream_id text, duration_seconds numeric, width integer, height integer, display_order integer, creator_username text, creator_display_name text, creator_avatar_url text, creator_is_verified boolean, business_name text, business_logo_url text, business_is_verified boolean, like_count bigint, comment_count bigint, share_count bigint, review_rating numeric, review_course_id uuid, review_course_name text, review_course_image text, review_course_region text, review_course_country text, review_course_sub_country text, creator_relation text, is_liked_by_me boolean, is_followed_by_me boolean, engagement_score numeric, post_type text, tournament_meta jsonb, review_text text, post_tags jsonb, course_id uuid, course_name text, review_design_score numeric, review_condition_score numeric, review_facilities_score numeric, review_clubhouse_score numeric, mutual_friends_count integer, country_match boolean, top100_list_match boolean, rated_post_course boolean, course_avg_overall_score numeric)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  v_cursor_ts timestamptz;
  v_mode text := COALESCE(p_mode, 'suggested');
  v_page_size integer := LEAST(COALESCE(p_page_size, 10), 60);
  v_user_country text;
  v_primary_list_id uuid;
  v_session_hour bigint;
  v_session_seed bigint;
  v_viewer_actor_type text := COALESCE(p_viewer_actor_type, 'personal');
  v_viewer_actor_id uuid := COALESCE(p_viewer_actor_id, p_user_id);
BEGIN
  IF p_cursor IS NOT NULL THEN
    v_cursor_ts := p_cursor::timestamptz;
  END IF;

  SELECT lower(NULLIF(country, '')) INTO v_user_country
    FROM user_profiles WHERE id = p_user_id;

  SELECT tl.id INTO v_primary_list_id
    FROM top100_lists tl
    JOIN course_top100_memberships ctm ON ctm.list_id = tl.id
    JOIN course_ratings cr
      ON cr.course_id = ctm.course_id
      AND cr.user_id = p_user_id
      AND cr.rating IS NOT NULL
    WHERE tl.is_active = true
    GROUP BY tl.id, tl.sort_order
    ORDER BY COUNT(*) DESC, tl.sort_order ASC
    LIMIT 1;

  v_session_hour := floor(extract(epoch from now()) / 3600)::bigint;
  v_session_seed := (
    ('x' || substr(md5(p_user_id::text || v_session_hour::text), 1, 8))::bit(32)
  )::bigint;

  RETURN QUERY
  WITH
  my_following AS (
    SELECT uf.following_id FROM user_follows uf WHERE uf.follower_id = p_user_id
  ),
  my_fof AS (
    SELECT uf2.follower_id AS fof_user_id, COUNT(*)::integer AS mutual_count
    FROM user_follows uf1
    JOIN user_follows uf2 ON uf2.following_id = uf1.following_id
    WHERE uf1.follower_id = p_user_id
      AND uf1.following_id <> p_user_id
    GROUP BY uf2.follower_id
  ),
  my_rated_courses AS (
    SELECT DISTINCT cr_rated.course_id
    FROM course_ratings cr_rated
    WHERE cr_rated.user_id = p_user_id AND cr_rated.rating IS NOT NULL
  ),
  my_list_courses AS (
    SELECT ctm.course_id
    FROM course_top100_memberships ctm
    WHERE v_primary_list_id IS NOT NULL AND ctm.list_id = v_primary_list_id
  ),
  candidates AS (
    SELECT
      p.id, p.created_at, p.content, p.course_id,
      p.like_count, p.comment_count, p.is_pinned,
      p.user_id AS p_uid, p.actor_type, p.actor_id,
      p.source_review_id, p.post_type, p.status
    FROM posts p
    WHERE p.visibility = 'anyone'
      AND p.status = 'published'
      AND p.user_id <> p_user_id
      AND (v_cursor_ts IS NULL OR p.created_at < v_cursor_ts)
      AND p.id <> ALL(p_seen_post_ids)
      AND (
        p.source_review_id IS NOT NULL
        OR EXISTS (
          SELECT 1 FROM post_media pm
          WHERE pm.post_id = p.id
            AND (
              (pm.media_type = 'video'
                AND pm.width IS NOT NULL AND pm.height IS NOT NULL
                AND pm.height > 0
                AND (pm.width::numeric / pm.height::numeric) < 1.0
                AND (pm.duration_ms IS NULL OR pm.duration_ms >= 4000))
              OR
              (pm.media_type = 'image'
                AND pm.width IS NOT NULL AND pm.height IS NOT NULL
                AND pm.width < pm.height)
            )
        )
      )
    ORDER BY p.created_at DESC
    LIMIT v_page_size * 40
  ),
  candidates_resolved AS (
    SELECT c.*,
      COALESCE(
        (SELECT cr.course_id FROM course_ratings cr WHERE cr.id = c.source_review_id),
        c.course_id
      ) AS resolved_course_id
    FROM candidates c
  ),
  scored AS (
    SELECT cr.*,
      CASE WHEN v_mode = 'popular' THEN
        (COALESCE(cr.like_count, 0) * 1.0 + COALESCE(cr.comment_count, 0) * 2.5)
        / (1.0 + EXTRACT(EPOCH FROM (now() - cr.created_at)) / 86400.0)
      ELSE 0 END AS popular_score,
      CASE WHEN mf.following_id IS NOT NULL THEN p_boost_followed ELSE 1.0 END AS boost_followed,
      CASE WHEN fof.fof_user_id IS NOT NULL THEN p_boost_mutual_friends ELSE 1.0 END AS boost_mutual,
      CASE WHEN v_user_country IS NOT NULL
            AND lower(gc_b.sub_country) = v_user_country
           THEN p_boost_country_match ELSE 1.0 END AS boost_country,
      CASE WHEN mlc.course_id IS NOT NULL THEN p_boost_top100_list ELSE 1.0 END AS boost_top100,
      CASE WHEN mrc.course_id IS NOT NULL THEN p_boost_rated_course ELSE 1.0 END AS boost_rated,
      p_freshness_base * POWER(0.5,
        EXTRACT(EPOCH FROM (now() - cr.created_at)) / 3600.0 / p_freshness_half_life_hours
      ) AS freshness_score,
      (COALESCE(cr.like_count, 0) * p_engagement_per_like) +
      (COALESCE(cr.comment_count, 0) * p_engagement_per_comment) AS engagement_bonus,
      CASE WHEN cr.source_review_id IS NOT NULL THEN p_review_bonus ELSE 1.0 END AS review_mult,
      p_entropy_floor + (
        ((('x' || substr(md5(v_session_seed::text || cr.id::text), 1, 8))::bit(32))::bigint
          % 1000000)::numeric / 1000000.0
      ) * p_entropy_range AS jitter,
      COALESCE(fof.mutual_count, 0) AS mutual_friends_count,
      ROW_NUMBER() OVER (PARTITION BY cr.p_uid ORDER BY cr.created_at DESC) AS creator_rank
    FROM candidates_resolved cr
    LEFT JOIN my_following mf       ON mf.following_id = cr.p_uid
    LEFT JOIN my_fof fof            ON fof.fof_user_id = cr.p_uid
    LEFT JOIN my_rated_courses mrc  ON mrc.course_id = cr.resolved_course_id
    LEFT JOIN my_list_courses mlc   ON mlc.course_id = cr.resolved_course_id
    LEFT JOIN golf_courses gc_b     ON gc_b.id = cr.resolved_course_id
  ),
  scored_with_orbit AS (
    SELECT s.*,
      ((s.freshness_score + s.engagement_bonus)
        * s.review_mult * s.jitter
        * s.boost_followed * s.boost_mutual * s.boost_country
        * s.boost_top100 * s.boost_rated) AS orbit_score
    FROM scored s
  ),
  top_post_ids AS (
    SELECT s.id FROM scored_with_orbit s
    WHERE (v_mode <> 'popular' OR s.creator_rank <= 3)
    ORDER BY
      CASE WHEN v_mode = 'popular' THEN s.popular_score END DESC NULLS LAST,
      CASE WHEN v_mode <> 'popular' THEN s.orbit_score END DESC NULLS LAST
    LIMIT v_page_size
  ),
  with_media AS (
    SELECT
      s.id AS wm_post_id, s.content AS wm_post_content,
      s.created_at AS wm_post_created_at, s.p_uid AS wm_post_user_id,
      s.actor_type AS wm_post_actor_type, s.actor_id AS wm_post_actor_id,
      s.status AS wm_post_status, s.source_review_id AS wm_source_review_id,
      pm.id AS wm_media_id, pm.media_type AS wm_media_type,
      pm.media_url AS wm_media_url, pm.poster_url AS wm_poster_url,
      NULL::text AS wm_stream_id,
      pm.duration_ms::numeric / 1000.0 AS wm_duration_seconds,
      pm.width AS wm_width, pm.height AS wm_height, pm.display_order AS wm_display_order,
      up.username AS wm_creator_username, up.display_name AS wm_creator_display_name,
      up.profile_photo_url AS wm_creator_avatar_url,
      COALESCE(up.is_verified, FALSE) AS wm_creator_is_verified,
      ba.name AS wm_business_name, ba.logo_url AS wm_business_logo_url,
      COALESCE(ba.is_verified, FALSE) AS wm_business_is_verified,
      COALESCE(s.like_count, 0)::bigint AS wm_like_count,
      COALESCE(s.comment_count, 0)::bigint AS wm_comment_count,
      0::bigint AS wm_share_count,
      cr.rating AS wm_review_rating, cr.course_id AS wm_review_course_id,
      COALESCE(gc_review.name, gc_course.name) AS wm_review_course_name,
      COALESCE(gc_review.thumbnail_image, gc_course.thumbnail_image) AS wm_review_course_image,
      COALESCE(gc_review.region, gc_course.region) AS wm_review_course_region,
      COALESCE(gc_review.country, gc_course.country) AS wm_review_course_country,
      COALESCE(gc_review.sub_country, gc_course.sub_country) AS wm_review_course_sub_country,
      CASE
        WHEN mf2.following_id IS NOT NULL THEN 'following'
        WHEN fof2.fof_user_id IS NOT NULL THEN 'fof'
        ELSE 'none'
      END AS wm_creator_relation,
      EXISTS (SELECT 1 FROM post_likes pl
        WHERE pl.post_id = s.id
          AND pl.actor_type = v_viewer_actor_type
          AND pl.actor_id = v_viewer_actor_id) AS wm_is_liked_by_me,
      (mf2.following_id IS NOT NULL) AS wm_is_followed_by_me,
      CASE WHEN v_mode = 'popular' THEN s.popular_score
           ELSE s.orbit_score END AS wm_engagement_score,
      COALESCE(s.post_type, 'post') AS wm_post_type,
      NULL::jsonb AS wm_tournament_meta,
      cr.review AS wm_review_text,
      public.get_post_tags_jsonb(s.id) AS wm_post_tags,
      gc_course.id AS wm_course_id, gc_course.name AS wm_course_name,
      cr.design_score AS wm_review_design_score,
      cr.condition_score AS wm_review_condition_score,
      cr.facilities_score AS wm_review_facilities_score,
      cr.clubhouse_score AS wm_review_clubhouse_score,
      s.mutual_friends_count AS wm_mutual_friends_count,
      (v_user_country IS NOT NULL
        AND lower(COALESCE(gc_review.sub_country, gc_course.sub_country)) = v_user_country
      ) AS wm_country_match,
      (mlc2.course_id IS NOT NULL) AS wm_top100_list_match,
      (mrc2.course_id IS NOT NULL) AS wm_rated_post_course,
      cra.avg_overall_score AS wm_course_avg_overall_score
    FROM scored_with_orbit s
    INNER JOIN top_post_ids tpi ON tpi.id = s.id
    LEFT JOIN user_profiles up ON up.id = s.p_uid
    LEFT JOIN business_accounts ba ON s.actor_type = 'business' AND ba.id = s.actor_id
    LEFT JOIN post_media pm ON pm.post_id = s.id
    LEFT JOIN course_ratings cr ON s.source_review_id IS NOT NULL AND cr.id = s.source_review_id
    LEFT JOIN golf_courses gc_review ON cr.course_id IS NOT NULL AND gc_review.id = cr.course_id
    LEFT JOIN golf_courses gc_course ON s.course_id IS NOT NULL AND gc_course.id = s.course_id
    LEFT JOIN course_rating_aggregates cra ON cra.course_id = COALESCE(cr.course_id, s.course_id)
    LEFT JOIN my_following mf2      ON mf2.following_id = s.p_uid
    LEFT JOIN my_fof fof2           ON fof2.fof_user_id = s.p_uid
    LEFT JOIN my_list_courses mlc2  ON mlc2.course_id = COALESCE(cr.course_id, s.course_id)
    LEFT JOIN my_rated_courses mrc2 ON mrc2.course_id = COALESCE(cr.course_id, s.course_id)
    WHERE (v_mode <> 'popular' OR s.creator_rank <= 3)
  )
  SELECT
    wm.wm_post_id, wm.wm_post_content, wm.wm_post_created_at,
    wm.wm_post_user_id, wm.wm_post_actor_type, wm.wm_post_actor_id,
    wm.wm_post_status, wm.wm_source_review_id, wm.wm_media_id,
    wm.wm_media_type, wm.wm_media_url, wm.wm_poster_url, wm.wm_stream_id,
    wm.wm_duration_seconds, wm.wm_width, wm.wm_height, wm.wm_display_order,
    wm.wm_creator_username, wm.wm_creator_display_name, wm.wm_creator_avatar_url,
    wm.wm_creator_is_verified, wm.wm_business_name, wm.wm_business_logo_url,
    wm.wm_business_is_verified, wm.wm_like_count, wm.wm_comment_count,
    wm.wm_share_count, wm.wm_review_rating, wm.wm_review_course_id,
    wm.wm_review_course_name, wm.wm_review_course_image, wm.wm_review_course_region,
    wm.wm_review_course_country, wm.wm_review_course_sub_country,
    wm.wm_creator_relation, wm.wm_is_liked_by_me, wm.wm_is_followed_by_me,
    wm.wm_engagement_score, wm.wm_post_type, wm.wm_tournament_meta,
    wm.wm_review_text, wm.wm_post_tags,
    wm.wm_course_id, wm.wm_course_name,
    wm.wm_review_design_score, wm.wm_review_condition_score,
    wm.wm_review_facilities_score, wm.wm_review_clubhouse_score,
    wm.wm_mutual_friends_count, wm.wm_country_match,
    wm.wm_top100_list_match, wm.wm_rated_post_course,
    wm.wm_course_avg_overall_score
  FROM with_media wm
  ORDER BY
    wm.wm_engagement_score DESC NULLS LAST,
    wm.wm_display_order ASC;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_suggested_feed_v2(uuid, integer, text, uuid[], text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text, uuid) TO authenticated, anon, service_role;
