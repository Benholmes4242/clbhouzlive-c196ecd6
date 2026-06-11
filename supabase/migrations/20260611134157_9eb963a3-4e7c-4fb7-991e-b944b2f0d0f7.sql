-- Add course community rating (avg_overall_score) to feed RPCs.
-- Idempotent: drops existing signatures then recreates with course_avg_overall_score column appended.

DROP FUNCTION IF EXISTS public.get_suggested_feed(uuid, integer, text, uuid[], text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric);

CREATE OR REPLACE FUNCTION public.get_suggested_feed(
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
  p_boost_rated_course numeric DEFAULT 1.50
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
  WITH candidates AS (
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
      CASE WHEN EXISTS (
        SELECT 1 FROM user_follows
        WHERE follower_id = p_user_id AND following_id = cr.p_uid
      ) THEN p_boost_followed ELSE 1.0 END AS boost_followed,
      CASE WHEN (
        SELECT COUNT(*) FROM user_follows uf1
        JOIN user_follows uf2 ON uf2.following_id = uf1.following_id
        WHERE uf1.follower_id = p_user_id AND uf2.follower_id = cr.p_uid
          AND uf1.following_id <> p_user_id AND uf1.following_id <> cr.p_uid
      ) >= 1 THEN p_boost_mutual_friends ELSE 1.0 END AS boost_mutual,
      CASE WHEN v_user_country IS NOT NULL AND lower(
        (SELECT gc.sub_country FROM golf_courses gc WHERE gc.id = cr.resolved_course_id)
      ) = v_user_country THEN p_boost_country_match ELSE 1.0 END AS boost_country,
      CASE WHEN v_primary_list_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM course_top100_memberships ctm
        WHERE ctm.list_id = v_primary_list_id AND ctm.course_id = cr.resolved_course_id
      ) THEN p_boost_top100_list ELSE 1.0 END AS boost_top100,
      CASE WHEN EXISTS (
        SELECT 1 FROM course_ratings cr2
        WHERE cr2.user_id = p_user_id AND cr2.rating IS NOT NULL
          AND cr2.course_id = cr.resolved_course_id
      ) THEN p_boost_rated_course ELSE 1.0 END AS boost_rated,
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
      ROW_NUMBER() OVER (PARTITION BY cr.p_uid ORDER BY cr.created_at DESC) AS creator_rank
    FROM candidates_resolved cr
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
        WHEN EXISTS (SELECT 1 FROM user_follows
          WHERE follower_id = p_user_id AND following_id = s.p_uid) THEN 'following'
        WHEN EXISTS (
          SELECT 1 FROM user_follows uf1
          JOIN user_follows uf2 ON uf2.follower_id = uf1.following_id
          WHERE uf1.follower_id = p_user_id AND uf2.following_id = s.p_uid
            AND uf1.following_id <> p_user_id AND uf1.following_id <> s.p_uid
        ) THEN 'fof'
        ELSE 'none'
      END AS wm_creator_relation,
      EXISTS (SELECT 1 FROM post_likes pl
        WHERE pl.post_id = s.id AND pl.user_id = p_user_id) AS wm_is_liked_by_me,
      EXISTS (SELECT 1 FROM user_follows uf
        WHERE uf.follower_id = p_user_id AND uf.following_id = s.p_uid) AS wm_is_followed_by_me,
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
      (SELECT COUNT(*)::integer FROM user_follows uf1
        JOIN user_follows uf2 ON uf2.following_id = uf1.following_id
        WHERE uf1.follower_id = p_user_id AND uf2.follower_id = s.p_uid
          AND uf1.following_id <> p_user_id AND uf1.following_id <> s.p_uid
      ) AS wm_mutual_friends_count,
      (v_user_country IS NOT NULL
        AND lower(COALESCE(gc_review.sub_country, gc_course.sub_country)) = v_user_country
      ) AS wm_country_match,
      (v_primary_list_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM course_top100_memberships ctm
        WHERE ctm.list_id = v_primary_list_id
          AND ctm.course_id = COALESCE(cr.course_id, s.course_id)
      )) AS wm_top100_list_match,
      EXISTS (SELECT 1 FROM course_ratings cr2
        WHERE cr2.user_id = p_user_id AND cr2.rating IS NOT NULL
          AND cr2.course_id = COALESCE(cr.course_id, s.course_id)
      ) AS wm_rated_post_course,
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

DROP FUNCTION IF EXISTS public.get_friends_feed(uuid, text, integer, timestamp with time zone, uuid[], text, text, uuid);

CREATE OR REPLACE FUNCTION public.get_friends_feed(
  p_user_id uuid,
  p_mode text DEFAULT 'latest'::text,
  p_page_size integer DEFAULT 15,
  p_cursor timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_seen_post_ids uuid[] DEFAULT '{}'::uuid[],
  p_search_query text DEFAULT NULL::text,
  p_viewer_actor_type text DEFAULT 'personal'::text,
  p_viewer_actor_id uuid DEFAULT NULL::uuid
)
 RETURNS TABLE(post_id uuid, post_content text, post_created_at timestamp with time zone, post_user_id uuid, post_actor_type text, post_actor_id uuid, post_status text, source_review_id uuid, media_id uuid, media_type text, media_url text, poster_url text, stream_id text, duration_seconds numeric, width integer, height integer, display_order integer, creator_username text, creator_display_name text, creator_avatar_url text, creator_is_verified boolean, business_name text, business_logo_url text, business_is_verified boolean, like_count bigint, comment_count bigint, share_count bigint, review_rating numeric, review_course_id uuid, review_course_name text, review_course_image text, review_course_region text, review_course_country text, review_course_sub_country text, course_region text, course_country text, creator_relation text, is_liked_by_me boolean, is_followed_by_me boolean, engagement_score numeric, review_text text, post_tags jsonb, course_id uuid, course_name text, course_thumbnail_image text, course_latitude double precision, course_longitude double precision, course_global_rank integer, creator_handicap_index numeric, creator_show_handicap boolean, creator_home_club text, creator_home_club_visibility text, review_design_score numeric, review_condition_score numeric, review_facilities_score numeric, review_clubhouse_score numeric, course_avg_overall_score numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := p_user_id;
  v_mode TEXT := p_mode;
  v_page_size INT := p_page_size;
  v_cursor TIMESTAMPTZ := p_cursor;
  v_seen_post_ids UUID[] := p_seen_post_ids;
  v_search_query TEXT := p_search_query;
  v_search_pattern TEXT := NULL;
  v_viewer_actor_type TEXT := COALESCE(p_viewer_actor_type, 'personal');
  v_viewer_actor_id UUID := COALESCE(p_viewer_actor_id, p_user_id);
BEGIN
  IF v_search_query IS NOT NULL AND v_search_query <> '' THEN
    v_search_pattern := '%' || lower(v_search_query) || '%';
  END IF;

  RETURN QUERY
  WITH social_graph AS (
    SELECT uf.friend_id AS target_user_id, 'personal'::TEXT AS target_type, 'friend'::TEXT AS rel
    FROM user_friends uf WHERE uf.user_id = v_user_id AND uf.status = 'accepted'
    UNION
    SELECT uf2.user_id, 'personal'::TEXT, 'friend'::TEXT
    FROM user_friends uf2 WHERE uf2.friend_id = v_user_id AND uf2.status = 'accepted'
    UNION
    SELECT ufl.following_id, 'personal'::TEXT, 'following'::TEXT
    FROM user_follows ufl WHERE ufl.follower_id = v_user_id
    UNION
    SELECT bf.business_id, 'business'::TEXT, 'following'::TEXT
    FROM business_follows bf WHERE bf.follower_id = v_user_id
  ),
  blocked_users AS (
    SELECT blocked_id FROM user_blocks WHERE blocker_id = v_user_id
    UNION
    SELECT blocker_id FROM user_blocks WHERE blocked_id = v_user_id
  ),
  candidates AS (
    SELECT
      p.id, p.content, p.created_at, p.user_id, p.actor_type, p.actor_id,
      p.status, p.source_review_id, p.course_id,
      COALESCE(p.like_count, 0)::bigint AS plc,
      COALESCE(p.comment_count, 0)::bigint AS pcc,
      0::bigint AS psc,
      sg.rel AS sg_rel,
      ROW_NUMBER() OVER (PARTITION BY p.user_id ORDER BY p.created_at DESC) AS creator_rank,
      (COALESCE(p.like_count, 0) * 3.0 + COALESCE(p.comment_count, 0) * 5.0)
        * EXP(-0.08 * EXTRACT(EPOCH FROM (now() - p.created_at)) / 86400.0)
        AS score
    FROM posts p
    JOIN social_graph sg ON (
      (sg.target_type = 'personal' AND sg.target_user_id = p.user_id)
      OR (sg.target_type = 'business' AND sg.target_user_id = p.actor_id AND p.actor_type = 'business')
    )
    WHERE p.visibility = 'anyone'
      AND p.status = 'published'
      AND p.created_at > NOW() - INTERVAL '90 days'
      AND (v_cursor IS NULL OR p.created_at < v_cursor)
      AND p.id <> ALL(v_seen_post_ids)
      AND p.user_id NOT IN (SELECT blocked_id FROM blocked_users)
      AND (
        v_search_pattern IS NULL
        OR lower(COALESCE(p.content, '')) LIKE v_search_pattern
        OR lower(COALESCE((SELECT up.display_name FROM user_profiles up WHERE up.id = p.user_id), '')) LIKE v_search_pattern
      )
  ),
  scored AS (
    SELECT
      c.*,
      pm.id AS pm_id, pm.media_type AS pm_media_type, pm.media_url AS pm_media_url,
      pm.poster_url AS pm_poster_url, NULL::text AS pm_stream_id,
      pm.duration_ms::numeric / 1000.0 AS pm_duration,
      pm.width AS pm_width, pm.height AS pm_height, pm.display_order AS pm_display_order
    FROM candidates c
    LEFT JOIN post_media pm ON pm.post_id = c.id
  )
  SELECT
    s.id, s.content, s.created_at, s.user_id,
    COALESCE(s.actor_type, 'personal'), s.actor_id, s.status, s.source_review_id,
    s.pm_id, s.pm_media_type, s.pm_media_url, s.pm_poster_url, s.pm_stream_id,
    s.pm_duration, s.pm_width, s.pm_height, s.pm_display_order,
    up.username, up.display_name, up.profile_photo_url,
    COALESCE(up.is_verified, false),
    ba.name, ba.logo_url, COALESCE(ba.is_verified, false),
    s.plc, s.pcc, s.psc,
    cr.rating, gc_review.id, gc_review.name, gc_review.thumbnail_image,
    gc_review.region, gc_review.country, gc_review.sub_country,
    gc_course.region, gc_course.country,
    COALESCE(s.sg_rel, 'none'),
    EXISTS (SELECT 1 FROM post_likes pl2 WHERE pl2.post_id = s.id AND pl2.user_id = v_user_id),
    public.is_following_actor_v2(v_viewer_actor_type, v_viewer_actor_id, s.actor_type, s.actor_id, s.user_id),
    s.score, cr.review,
    public.get_post_tags_jsonb(s.id),
    s.course_id, gc_course.name, gc_course.thumbnail_image,
    gc_course.latitude::double precision, gc_course.longitude::double precision,
    gc_course.global_rank,
    up.eg_handicap_index::numeric, COALESCE(up.show_handicap, true),
    up.home_club, COALESCE(up.home_club_visibility, 'public'),
    cr.design_score, cr.condition_score, cr.facilities_score, cr.clubhouse_score,
    cra.avg_overall_score
  FROM scored s
  LEFT JOIN user_profiles up ON up.id = s.user_id
  LEFT JOIN business_accounts ba ON s.actor_type = 'business' AND ba.id = s.actor_id
  LEFT JOIN course_ratings cr ON s.source_review_id IS NOT NULL AND cr.id = s.source_review_id
  LEFT JOIN golf_courses gc_review ON cr.course_id IS NOT NULL AND gc_review.id = cr.course_id
  LEFT JOIN golf_courses gc_course ON s.course_id IS NOT NULL AND gc_course.id = s.course_id
  LEFT JOIN course_rating_aggregates cra ON cra.course_id = COALESCE(cr.course_id, s.course_id)
  WHERE (v_mode <> 'popular' OR s.creator_rank <= 3)
  ORDER BY
    CASE WHEN v_mode = 'popular' THEN s.score END DESC NULLS LAST,
    s.created_at DESC
  LIMIT v_page_size;
END;
$function$;