-- ============================================================================
-- PR 3: Review Data Wiring
-- Widens 6 feed RPCs with breakdown sub-score columns +
-- adds get_reviewer_stats(p_user_id).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) get_course_media — add 4 breakdown columns
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_course_media(uuid, uuid, text, integer, timestamp with time zone, uuid[]);

CREATE OR REPLACE FUNCTION public.get_course_media(
  p_user_id uuid,
  p_course_id uuid,
  p_filter text DEFAULT 'all'::text,
  p_page_size integer DEFAULT 30,
  p_cursor timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_seen_post_ids uuid[] DEFAULT '{}'::uuid[]
)
RETURNS TABLE(
  post_id uuid, post_content text, post_created_at timestamp with time zone,
  post_user_id uuid, post_actor_type text, post_actor_id uuid,
  post_status text, source_review_id uuid,
  media_id uuid, media_type text, media_url text, poster_url text, stream_id text,
  duration_seconds numeric, width integer, height integer, display_order integer,
  creator_username text, creator_display_name text, creator_avatar_url text, creator_is_verified boolean,
  business_name text, business_logo_url text, business_is_verified boolean,
  like_count bigint, comment_count bigint, share_count bigint,
  review_rating numeric, review_course_id uuid, review_course_name text, review_course_image text,
  course_region text, course_country text,
  creator_relation text, is_liked_by_me boolean, is_followed_by_me boolean, engagement_score numeric,
  review_design_score numeric, review_condition_score numeric,
  review_facilities_score numeric, review_clubhouse_score numeric
)
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  v_user_id UUID := p_user_id;
  v_course_id UUID := p_course_id;
  v_filter TEXT := p_filter;
  v_page_size INT := p_page_size;
  v_cursor TIMESTAMPTZ := p_cursor;
  v_seen_post_ids UUID[] := p_seen_post_ids;
BEGIN
  RETURN QUERY
  WITH
  blocked_users AS (
    SELECT blocked_id AS uid FROM user_blocks WHERE blocker_id = v_user_id
    UNION SELECT blocker_id AS uid FROM user_blocks WHERE blocked_id = v_user_id
  ),
  distinct_posts AS (
    SELECT DISTINCT ON (p.id)
      p.id AS p_id, p.content AS p_content, p.created_at AS p_created_at,
      p.user_id AS p_user_id, p.actor_type AS p_actor_type, p.actor_id AS p_actor_id,
      p.status AS p_status, p.source_review_id AS p_source_review_id,
      p.course_id AS p_course_id,
      pm.media_type AS pm_media_type
    FROM posts p
    INNER JOIN post_media pm ON pm.post_id = p.id
    LEFT JOIN blocked_users bu ON bu.uid = p.user_id
    WHERE p.status = 'published'
      AND bu.uid IS NULL
      AND (v_cursor IS NULL OR p.created_at < v_cursor)
      AND NOT (p.id = ANY(v_seen_post_ids))
      AND (
        p.course_id = v_course_id
        OR (p.source_review_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM course_ratings cr_check
          WHERE cr_check.id = p.source_review_id AND cr_check.course_id = v_course_id
        ))
      )
      AND (
        v_filter = 'all'
        OR (v_filter = 'photos' AND pm.media_type = 'image')
        OR (v_filter = 'videos' AND pm.media_type = 'video')
      )
    ORDER BY p.id, pm.display_order
  ),
  enriched AS (
    SELECT dp.*,
      COALESCE(plc.cnt, 0) AS p_like_count,
      COALESCE(pcc.cnt, 0) AS p_comment_count,
      COALESCE(psc.cnt, 0) AS p_share_count,
      CASE WHEN ml.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS p_liked_by_me,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM user_friends uf
          WHERE (uf.user_id = v_user_id AND uf.friend_id = dp.p_user_id AND uf.status = 'accepted')
            OR (uf.friend_id = v_user_id AND uf.user_id = dp.p_user_id AND uf.status = 'accepted')
        ) THEN 'friend'
        WHEN EXISTS (
          SELECT 1 FROM user_follows ufl WHERE ufl.follower_id = v_user_id AND ufl.following_id = dp.p_user_id
        ) THEN 'following'
        ELSE 'none'
      END AS p_relation,
      EXISTS (
        SELECT 1 FROM user_follows uf3 WHERE uf3.follower_id = v_user_id AND uf3.following_id = dp.p_user_id
      ) AS p_followed_by_me,
      cr.rating AS p_review_rating,
      cr.design_score AS p_review_design_score,
      cr.condition_score AS p_review_condition_score,
      cr.facilities_score AS p_review_facilities_score,
      cr.clubhouse_score AS p_review_clubhouse_score,
      gc_review.id AS p_review_course_id, gc_review.name AS p_review_course_name,
      gc_review.thumbnail_image AS p_review_course_image,
      gc_course.region AS p_course_region, gc_course.country AS p_course_country,
      up.username AS p_creator_username, up.display_name AS p_creator_display_name,
      up.profile_photo_url AS p_creator_avatar,
      COALESCE(up.is_verified, FALSE) AS p_creator_verified,
      ba.name AS p_business_name, ba.logo_url AS p_business_logo,
      COALESCE(ba.is_verified, FALSE) AS p_business_verified
    FROM distinct_posts dp
    LEFT JOIN user_profiles up ON up.id = dp.p_user_id
    LEFT JOIN business_accounts ba ON ba.id = dp.p_actor_id AND dp.p_actor_type = 'business'
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_likes pl WHERE pl.post_id = dp.p_id) plc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_comments pc WHERE pc.post_id = dp.p_id) pcc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_shares ps WHERE ps.post_id = dp.p_id) psc ON TRUE
    LEFT JOIN post_likes ml ON ml.post_id = dp.p_id AND ml.user_id = v_user_id
    LEFT JOIN course_ratings cr ON cr.id = dp.p_source_review_id
    LEFT JOIN golf_courses gc_review ON gc_review.id = cr.course_id
    LEFT JOIN golf_courses gc_course ON gc_course.id = dp.p_course_id
  ),
  posts_media AS (
    SELECT
      e.p_id, e.p_content, e.p_created_at, e.p_user_id, e.p_actor_type, e.p_actor_id,
      e.p_status, e.p_source_review_id,
      pm2.id AS pm_id, pm2.media_type AS pm_media_type, pm2.media_url AS pm_media_url,
      pm2.poster_url AS pm_poster_url, pm2.stream_id AS pm_stream_id,
      pm2.duration_seconds AS pm_duration, pm2.width AS pm_width, pm2.height AS pm_height,
      pm2.display_order AS pm_display_order,
      e.p_creator_username, e.p_creator_display_name, e.p_creator_avatar, e.p_creator_verified,
      e.p_business_name, e.p_business_logo, e.p_business_verified,
      e.p_like_count, e.p_comment_count, e.p_share_count,
      e.p_review_rating, e.p_review_course_id, e.p_review_course_name, e.p_review_course_image,
      e.p_course_region, e.p_course_country,
      e.p_relation, e.p_liked_by_me, e.p_followed_by_me,
      (e.p_like_count * 1.0 + e.p_comment_count * 2.5 + e.p_share_count * 3.0)::NUMERIC AS p_engagement,
      e.p_review_design_score, e.p_review_condition_score,
      e.p_review_facilities_score, e.p_review_clubhouse_score
    FROM enriched e
    JOIN post_media pm2 ON pm2.post_id = e.p_id
  ),
  posts_media_urls AS (
    SELECT pm_media_url FROM posts_media
  ),
  review_only_media AS (
    SELECT
      crm.id AS rm_id,
      crm.media_url AS rm_media_url,
      crm.media_type AS rm_media_type,
      crm.poster_url AS rm_poster_url,
      crm.stream_id AS rm_stream_id,
      crm.duration_seconds AS rm_duration,
      crm.width AS rm_width,
      crm.height AS rm_height,
      crm.created_at AS rm_created_at,
      crm.review_id AS rm_review_id,
      cr2.user_id AS rm_user_id,
      cr2.rating AS rm_rating,
      cr2.design_score AS rm_design_score,
      cr2.condition_score AS rm_condition_score,
      cr2.facilities_score AS rm_facilities_score,
      cr2.clubhouse_score AS rm_clubhouse_score,
      cr2.course_id AS rm_course_id,
      gc2.name AS rm_course_name,
      gc2.thumbnail_image AS rm_course_image,
      gc2.region AS rm_course_region,
      gc2.country AS rm_course_country,
      up2.username AS rm_creator_username,
      up2.display_name AS rm_creator_display_name,
      up2.profile_photo_url AS rm_creator_avatar,
      COALESCE(up2.is_verified, FALSE) AS rm_creator_verified
    FROM course_review_media crm
    INNER JOIN course_ratings cr2 ON cr2.id = crm.review_id
    INNER JOIN golf_courses gc2 ON gc2.id = cr2.course_id
    LEFT JOIN user_profiles up2 ON up2.id = cr2.user_id
    LEFT JOIN blocked_users bu2 ON bu2.uid = cr2.user_id
    WHERE cr2.course_id = v_course_id
      AND bu2.uid IS NULL
      AND crm.media_url NOT IN (SELECT pm_media_url FROM posts_media_urls)
      AND (v_cursor IS NULL OR crm.created_at < v_cursor)
      AND (
        v_filter = 'all'
        OR (v_filter = 'photos' AND crm.media_type = 'image')
        OR (v_filter = 'videos' AND crm.media_type = 'video')
      )
  )
  SELECT * FROM (
    SELECT
      pms.p_id, pms.p_content, pms.p_created_at, pms.p_user_id, pms.p_actor_type, pms.p_actor_id,
      pms.p_status, pms.p_source_review_id,
      pms.pm_id, pms.pm_media_type, pms.pm_media_url, pms.pm_poster_url, pms.pm_stream_id,
      pms.pm_duration, pms.pm_width, pms.pm_height, pms.pm_display_order,
      pms.p_creator_username, pms.p_creator_display_name, pms.p_creator_avatar, pms.p_creator_verified,
      pms.p_business_name, pms.p_business_logo, pms.p_business_verified,
      pms.p_like_count, pms.p_comment_count, pms.p_share_count,
      pms.p_review_rating, pms.p_review_course_id, pms.p_review_course_name, pms.p_review_course_image,
      pms.p_course_region, pms.p_course_country,
      pms.p_relation, pms.p_liked_by_me, pms.p_followed_by_me,
      pms.p_engagement,
      pms.p_review_design_score, pms.p_review_condition_score,
      pms.p_review_facilities_score, pms.p_review_clubhouse_score
    FROM posts_media pms

    UNION ALL

    SELECT
      rom.rm_review_id AS p_id,
      NULL::TEXT AS p_content,
      rom.rm_created_at AS p_created_at,
      rom.rm_user_id AS p_user_id,
      'personal'::TEXT AS p_actor_type,
      rom.rm_user_id AS p_actor_id,
      'published'::TEXT AS p_status,
      rom.rm_review_id AS p_source_review_id,
      rom.rm_id AS pm_id,
      rom.rm_media_type AS pm_media_type,
      rom.rm_media_url AS pm_media_url,
      rom.rm_poster_url AS pm_poster_url,
      rom.rm_stream_id AS pm_stream_id,
      rom.rm_duration AS pm_duration,
      rom.rm_width AS pm_width,
      rom.rm_height AS pm_height,
      0 AS pm_display_order,
      rom.rm_creator_username, rom.rm_creator_display_name, rom.rm_creator_avatar, rom.rm_creator_verified,
      NULL::TEXT AS p_business_name,
      NULL::TEXT AS p_business_logo,
      FALSE AS p_business_verified,
      0::BIGINT AS p_like_count,
      0::BIGINT AS p_comment_count,
      0::BIGINT AS p_share_count,
      rom.rm_rating AS p_review_rating,
      rom.rm_course_id AS p_review_course_id,
      rom.rm_course_name AS p_review_course_name,
      rom.rm_course_image AS p_review_course_image,
      rom.rm_course_region AS p_course_region,
      rom.rm_course_country AS p_course_country,
      'none'::TEXT AS p_relation,
      FALSE AS p_liked_by_me,
      FALSE AS p_followed_by_me,
      0::NUMERIC AS p_engagement,
      rom.rm_design_score, rom.rm_condition_score,
      rom.rm_facilities_score, rom.rm_clubhouse_score
    FROM review_only_media rom
  ) combined
  ORDER BY p_created_at DESC, pm_display_order
  LIMIT v_page_size;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 2) get_explore_feed — add 4 breakdown columns
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_explore_feed(uuid, text, integer, timestamp with time zone, uuid[], text);

CREATE OR REPLACE FUNCTION public.get_explore_feed(
  p_user_id uuid,
  p_region text DEFAULT NULL::text,
  p_page_size integer DEFAULT 30,
  p_cursor timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_seen_post_ids uuid[] DEFAULT '{}'::uuid[],
  p_search_query text DEFAULT NULL::text
)
RETURNS TABLE(
  post_id uuid, post_content text, post_created_at timestamp with time zone,
  post_user_id uuid, post_actor_type text, post_actor_id uuid,
  post_status text, source_review_id uuid,
  media_id uuid, media_type text, media_url text, poster_url text, stream_id text,
  duration_seconds numeric, width integer, height integer, display_order integer,
  creator_username text, creator_display_name text, creator_avatar_url text, creator_is_verified boolean,
  business_name text, business_logo_url text, business_is_verified boolean,
  like_count bigint, comment_count bigint, share_count bigint,
  review_rating numeric, review_course_id uuid, review_course_name text, review_course_image text,
  course_region text, course_country text,
  creator_relation text, is_liked_by_me boolean, is_followed_by_me boolean, engagement_score numeric,
  review_design_score numeric, review_condition_score numeric,
  review_facilities_score numeric, review_clubhouse_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID := p_user_id;
  v_region TEXT := p_region;
  v_page_size INT := p_page_size;
  v_cursor TIMESTAMPTZ := p_cursor;
  v_seen_post_ids UUID[] := p_seen_post_ids;
  v_search_query TEXT := p_search_query;
  v_recency_halflife_hours NUMERIC := 24;
  v_max_post_age_days INT := 365;
  v_creator_cap INT := 3;
  v_fetch_multiplier INT := 4;
BEGIN
  RETURN QUERY
  WITH
  blocked_users AS (
    SELECT blocked_id AS uid FROM user_blocks WHERE blocker_id = v_user_id
    UNION SELECT blocker_id AS uid FROM user_blocks WHERE blocked_id = v_user_id
  ),
  my_follows AS (
    SELECT following_id AS uid FROM user_follows WHERE follower_id = v_user_id
  ),
  my_friends AS (
    SELECT friend_id AS uid FROM user_friends WHERE user_id = v_user_id AND status = 'accepted'
    UNION SELECT uf.user_id AS uid FROM user_friends uf WHERE uf.friend_id = v_user_id AND uf.status = 'accepted'
  ),
  my_business_follows AS (
    SELECT business_id AS bid FROM business_follows WHERE follower_id = v_user_id
  ),
  region_countries AS (
    SELECT erm.country FROM explore_region_members erm
    INNER JOIN explore_regions er ON er.id = erm.region_id
    WHERE er.slug = v_region
  ),
  distinct_posts AS (
    SELECT DISTINCT ON (p.id)
      p.id AS p_id, p.content AS p_content, p.created_at AS p_created_at,
      p.user_id AS p_user_id, p.actor_type AS p_actor_type, p.actor_id AS p_actor_id,
      p.status AS p_status, p.source_review_id AS p_source_review_id,
      p.course_id AS p_course_id,
      pm.media_type AS pm_media_type
    FROM posts p
    INNER JOIN post_media pm ON pm.post_id = p.id
    INNER JOIN golf_courses gc ON gc.id = p.course_id
    LEFT JOIN blocked_users bu ON bu.uid = p.user_id
    WHERE p.status = 'published'
      AND p.course_id IS NOT NULL
      AND pm.media_type IN ('video', 'image')
      AND bu.uid IS NULL
      AND p.created_at > NOW() - (v_max_post_age_days || ' days')::INTERVAL
      AND (v_cursor IS NULL OR p.created_at < v_cursor)
      AND NOT (p.id = ANY(v_seen_post_ids))
      AND (v_region IS NULL OR gc.country IN (SELECT country FROM region_countries))
      AND (v_search_query IS NULL
        OR p.content ILIKE '%' || v_search_query || '%'
        OR gc.name ILIKE '%' || v_search_query || '%')
    ORDER BY p.id, pm.display_order
  ),
  enriched AS (
    SELECT dp.*,
      gc.name AS p_course_name,
      gc.thumbnail_image AS p_course_image,
      gc.region AS p_course_region,
      gc.country AS p_course_country,
      cr.rating AS p_review_rating,
      cr.design_score AS p_review_design_score,
      cr.condition_score AS p_review_condition_score,
      cr.facilities_score AS p_review_facilities_score,
      cr.clubhouse_score AS p_review_clubhouse_score,
      COALESCE(plc.cnt, 0) AS p_like_count,
      COALESCE(pcc.cnt, 0) AS p_comment_count,
      COALESCE(psc.cnt, 0) AS p_share_count,
      CASE
        WHEN mfr.uid IS NOT NULL THEN 'friend'
        WHEN mfl.uid IS NOT NULL THEN 'following'
        WHEN mbf.bid IS NOT NULL AND dp.p_actor_type = 'business' THEN 'following'
        ELSE 'none'
      END AS p_relation,
      CASE WHEN ml.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS p_liked_by_me,
      CASE
        WHEN mfl.uid IS NOT NULL THEN TRUE
        WHEN mbf.bid IS NOT NULL AND dp.p_actor_type = 'business' THEN TRUE
        ELSE FALSE
      END AS p_followed_by_me,
      up.username AS p_creator_username, up.display_name AS p_creator_display_name,
      up.profile_photo_url AS p_creator_avatar,
      COALESCE(up.is_verified, FALSE) AS p_creator_verified,
      ba.name AS p_business_name, ba.logo_url AS p_business_logo,
      COALESCE(ba.is_verified, FALSE) AS p_business_verified
    FROM distinct_posts dp
    INNER JOIN golf_courses gc ON gc.id = dp.p_course_id
    LEFT JOIN course_ratings cr ON cr.id = dp.p_source_review_id
    LEFT JOIN user_profiles up ON up.id = dp.p_user_id
    LEFT JOIN business_accounts ba ON ba.id = dp.p_actor_id AND dp.p_actor_type = 'business'
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_likes pl WHERE pl.post_id = dp.p_id) plc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_comments pc WHERE pc.post_id = dp.p_id) pcc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_shares ps WHERE ps.post_id = dp.p_id) psc ON TRUE
    LEFT JOIN my_friends mfr ON mfr.uid = dp.p_user_id
    LEFT JOIN my_follows mfl ON mfl.uid = dp.p_user_id
    LEFT JOIN my_business_follows mbf ON mbf.bid = dp.p_actor_id AND dp.p_actor_type = 'business'
    LEFT JOIN post_likes ml ON ml.post_id = dp.p_id AND ml.user_id = v_user_id
  ),
  scored AS (
    SELECT e.*,
      GREATEST(
        (e.p_like_count * 1.0 + e.p_comment_count * 2.5 + e.p_share_count * 3.0)
        * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - e.p_created_at)) / 3600 / v_recency_halflife_hours)
        * CASE
            WHEN e.pm_media_type = 'video' THEN 3.0
            WHEN e.p_source_review_id IS NOT NULL THEN 2.0
            ELSE 1.0
          END,
        CASE
          WHEN e.pm_media_type = 'video' THEN 0.1
          WHEN e.p_source_review_id IS NOT NULL THEN 0.05
          ELSE 0.001
        END
      ) AS score,
      ROW_NUMBER() OVER (
        PARTITION BY e.p_user_id
        ORDER BY
          GREATEST(
            (e.p_like_count * 1.0 + e.p_comment_count * 2.5 + e.p_share_count * 3.0)
            * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - e.p_created_at)) / 3600 / v_recency_halflife_hours)
            * CASE WHEN e.pm_media_type = 'video' THEN 3.0 WHEN e.p_source_review_id IS NOT NULL THEN 2.0 ELSE 1.0 END,
            CASE WHEN e.pm_media_type = 'video' THEN 0.1 WHEN e.p_source_review_id IS NOT NULL THEN 0.05 ELSE 0.001 END
          ) DESC
      ) AS creator_rank
    FROM enriched e
  ),
  selected AS (
    SELECT s.p_id FROM scored s
    WHERE s.creator_rank <= v_creator_cap
    ORDER BY s.score DESC
    LIMIT v_page_size
  )
  SELECT
    sel.p_id, sc.p_content, sc.p_created_at, sc.p_user_id, sc.p_actor_type, sc.p_actor_id,
    sc.p_status, sc.p_source_review_id,
    pm2.id, pm2.media_type, pm2.media_url, pm2.poster_url, pm2.stream_id,
    pm2.duration_seconds, pm2.width, pm2.height, pm2.display_order,
    sc.p_creator_username, sc.p_creator_display_name, sc.p_creator_avatar, sc.p_creator_verified,
    sc.p_business_name, sc.p_business_logo, sc.p_business_verified,
    sc.p_like_count, sc.p_comment_count, sc.p_share_count,
    sc.p_review_rating, sc.p_course_id, sc.p_course_name, sc.p_course_image,
    sc.p_course_region, sc.p_course_country,
    sc.p_relation, sc.p_liked_by_me, sc.p_followed_by_me, sc.score,
    sc.p_review_design_score, sc.p_review_condition_score,
    sc.p_review_facilities_score, sc.p_review_clubhouse_score
  FROM selected sel
  JOIN scored sc ON sc.p_id = sel.p_id
  JOIN post_media pm2 ON pm2.post_id = sel.p_id
  ORDER BY sc.score DESC, pm2.display_order;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 3) get_friends_feed — add 4 breakdown columns
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_friends_feed(uuid, text, integer, timestamp with time zone, uuid[], text);

CREATE OR REPLACE FUNCTION public.get_friends_feed(
  p_user_id uuid,
  p_mode text DEFAULT 'latest'::text,
  p_page_size integer DEFAULT 15,
  p_cursor timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_seen_post_ids uuid[] DEFAULT '{}'::uuid[],
  p_search_query text DEFAULT NULL::text
)
RETURNS TABLE(
  post_id uuid, post_content text, post_created_at timestamp with time zone,
  post_user_id uuid, post_actor_type text, post_actor_id uuid,
  post_status text, source_review_id uuid,
  media_id uuid, media_type text, media_url text, poster_url text, stream_id text,
  duration_seconds numeric, width integer, height integer, display_order integer,
  creator_username text, creator_display_name text, creator_avatar_url text, creator_is_verified boolean,
  business_name text, business_logo_url text, business_is_verified boolean,
  like_count bigint, comment_count bigint, share_count bigint,
  review_rating numeric, review_course_id uuid, review_course_name text, review_course_image text,
  review_course_region text, review_course_country text, review_course_sub_country text,
  course_region text, course_country text,
  creator_relation text, is_liked_by_me boolean, is_followed_by_me boolean, engagement_score numeric,
  review_text text, post_tags jsonb, course_id uuid, course_name text,
  course_thumbnail_image text, course_latitude double precision, course_longitude double precision,
  course_global_rank integer,
  creator_handicap_index numeric, creator_show_handicap boolean,
  creator_home_club text, creator_home_club_visibility text,
  review_design_score numeric, review_condition_score numeric,
  review_facilities_score numeric, review_clubhouse_score numeric
)
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
    s.id AS post_id, s.content AS post_content, s.created_at AS post_created_at,
    s.user_id AS post_user_id, COALESCE(s.actor_type, 'personal') AS post_actor_type,
    s.actor_id AS post_actor_id, s.status AS post_status, s.source_review_id,
    s.pm_id AS media_id, s.pm_media_type AS media_type, s.pm_media_url AS media_url,
    s.pm_poster_url AS poster_url, s.pm_stream_id AS stream_id,
    s.pm_duration AS duration_seconds, s.pm_width AS width, s.pm_height AS height,
    s.pm_display_order AS display_order,
    up.username AS creator_username, up.display_name AS creator_display_name,
    up.profile_photo_url AS creator_avatar_url, COALESCE(up.is_verified, false) AS creator_is_verified,
    ba.name AS business_name, ba.logo_url AS business_logo_url,
    COALESCE(ba.is_verified, false) AS business_is_verified,
    s.plc AS like_count, s.pcc AS comment_count, s.psc AS share_count,
    cr.rating AS review_rating, gc_review.id AS review_course_id,
    gc_review.name AS review_course_name, gc_review.thumbnail_image AS review_course_image,
    gc_review.region AS review_course_region, gc_review.country AS review_course_country,
    gc_review.sub_country AS review_course_sub_country,
    gc_course.region AS course_region, gc_course.country AS course_country,
    COALESCE(s.sg_rel, 'none') AS creator_relation,
    EXISTS (SELECT 1 FROM post_likes pl2 WHERE pl2.post_id = s.id AND pl2.user_id = v_user_id) AS is_liked_by_me,
    EXISTS (SELECT 1 FROM user_follows uf3 WHERE uf3.follower_id = v_user_id AND uf3.following_id = s.user_id) AS is_followed_by_me,
    s.score AS engagement_score, cr.review AS review_text,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
          'id', pt.id,
          'entity_type', te.entity_type,
          'entity_id', te.entity_id,
          'name', te.name,
          'username', te.username,
          'start_index', pt.start_index,
          'end_index', pt.end_index
        ))
       FROM post_tags pt
       JOIN taggable_entities te ON te.id = pt.tagged_entity_id
       WHERE pt.post_id = s.id
         AND te.entity_type IN ('user', 'business', 'golf_club')
      ), '[]'::jsonb
    ) AS post_tags,
    s.course_id AS course_id,
    gc_course.name AS course_name,
    gc_course.thumbnail_image AS course_thumbnail_image,
    gc_course.latitude::double precision AS course_latitude,
    gc_course.longitude::double precision AS course_longitude,
    gc_course.global_rank AS course_global_rank,
    up.eg_handicap_index::numeric AS creator_handicap_index,
    COALESCE(up.show_handicap, true) AS creator_show_handicap,
    up.home_club AS creator_home_club,
    COALESCE(up.home_club_visibility, 'public') AS creator_home_club_visibility,
    cr.design_score AS review_design_score,
    cr.condition_score AS review_condition_score,
    cr.facilities_score AS review_facilities_score,
    cr.clubhouse_score AS review_clubhouse_score
  FROM scored s
  LEFT JOIN user_profiles up ON up.id = s.user_id
  LEFT JOIN business_accounts ba ON s.actor_type = 'business' AND ba.id = s.actor_id
  LEFT JOIN course_ratings cr ON s.source_review_id IS NOT NULL AND cr.id = s.source_review_id
  LEFT JOIN golf_courses gc_review ON cr.course_id IS NOT NULL AND gc_review.id = cr.course_id
  LEFT JOIN golf_courses gc_course ON s.course_id IS NOT NULL AND gc_course.id = s.course_id
  WHERE (v_mode <> 'popular' OR s.creator_rank <= 3)
  ORDER BY
    CASE WHEN v_mode = 'popular' THEN s.score END DESC NULLS LAST,
    s.created_at DESC
  LIMIT v_page_size;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 4) get_profile_posts — add 4 breakdown columns
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_profile_posts(uuid, text, uuid, integer, timestamp with time zone, uuid[]);

CREATE OR REPLACE FUNCTION public.get_profile_posts(
  p_user_id uuid,
  p_actor_type text,
  p_actor_id uuid,
  p_page_size integer DEFAULT 24,
  p_cursor timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_seen_post_ids uuid[] DEFAULT '{}'::uuid[]
)
RETURNS TABLE(
  post_id uuid, post_content text, post_created_at timestamp with time zone,
  post_user_id uuid, post_actor_type text, post_actor_id uuid,
  post_status text, source_review_id uuid,
  media_id uuid, media_type text, media_url text, poster_url text, stream_id text,
  duration_seconds numeric, width integer, height integer, display_order integer,
  creator_username text, creator_display_name text, creator_avatar_url text, creator_is_verified boolean,
  business_name text, business_logo_url text, business_is_verified boolean,
  like_count bigint, comment_count bigint, share_count bigint,
  review_rating numeric, review_course_id uuid, review_course_name text, review_course_image text,
  review_course_region text, review_course_country text, review_course_sub_country text,
  course_region text, course_country text,
  creator_relation text, is_liked_by_me boolean, is_followed_by_me boolean, engagement_score numeric,
  review_text text, post_tags jsonb, course_id uuid, course_name text,
  review_design_score numeric, review_condition_score numeric,
  review_facilities_score numeric, review_clubhouse_score numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id        UUID := p_user_id;
  v_actor_type     TEXT := p_actor_type;
  v_actor_id       UUID := p_actor_id;
  v_page_size      INT  := LEAST(COALESCE(p_page_size, 24), 60);
  v_cursor         TIMESTAMPTZ := p_cursor;
  v_seen_post_ids  UUID[] := COALESCE(p_seen_post_ids, '{}');
BEGIN
  RETURN QUERY
  SELECT
    p.id                                   AS post_id,
    p.content                              AS post_content,
    p.created_at                           AS post_created_at,
    p.user_id                              AS post_user_id,
    p.actor_type                           AS post_actor_type,
    p.actor_id                             AS post_actor_id,
    p.status                               AS post_status,
    p.source_review_id                     AS source_review_id,
    pm.id                                  AS media_id,
    pm.media_type                          AS media_type,
    pm.media_url                           AS media_url,
    pm.poster_url                          AS poster_url,
    pm.stream_id                           AS stream_id,
    pm.duration_seconds                    AS duration_seconds,
    pm.width                               AS width,
    pm.height                              AS height,
    pm.display_order                       AS display_order,
    up.username                            AS creator_username,
    up.display_name                        AS creator_display_name,
    up.profile_photo_url                   AS creator_avatar_url,
    COALESCE(up.is_verified, FALSE)        AS creator_is_verified,
    ba.name                                AS business_name,
    ba.logo_url                            AS business_logo_url,
    COALESCE(ba.is_verified, FALSE)        AS business_is_verified,
    COALESCE(p.like_count, 0)::BIGINT      AS like_count,
    COALESCE(p.comment_count, 0)::BIGINT   AS comment_count,
    0::BIGINT                              AS share_count,
    cr.rating                              AS review_rating,
    cr.course_id                           AS review_course_id,
    gc.name                                AS review_course_name,
    gc.thumbnail_image                     AS review_course_image,
    gc.region                              AS review_course_region,
    gc.country                             AS review_course_country,
    gc.sub_country                         AS review_course_sub_country,
    gc.region                              AS course_region,
    gc.country                             AS course_country,
    'none'::TEXT                           AS creator_relation,
    EXISTS (
      SELECT 1 FROM post_likes pl
      WHERE pl.post_id = p.id AND pl.user_id = v_user_id
    )                                      AS is_liked_by_me,
    CASE
      WHEN p.actor_type = 'business' THEN EXISTS (
        SELECT 1 FROM business_follows bf
        WHERE bf.business_id = p.actor_id AND bf.follower_id = v_user_id
      )
      ELSE EXISTS (
        SELECT 1 FROM user_follows fo
        WHERE fo.following_id = p.user_id AND fo.follower_id = v_user_id
      )
    END                                    AS is_followed_by_me,
    0::NUMERIC                             AS engagement_score,
    cr.review                              AS review_text,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
          'entity_type', te.entity_type,
          'entity_id', te.entity_id,
          'name', te.name,
          'username', te.username
        ))
       FROM post_tags pt
       JOIN taggable_entities te ON te.id = pt.tagged_entity_id
       WHERE pt.post_id = p.id
         AND te.entity_type IN ('user', 'business', 'golf_club')
      ), '[]'::jsonb
    )                                      AS post_tags,
    gc.id                                  AS course_id,
    gc.name                                AS course_name,
    cr.design_score                        AS review_design_score,
    cr.condition_score                     AS review_condition_score,
    cr.facilities_score                    AS review_facilities_score,
    cr.clubhouse_score                     AS review_clubhouse_score
  FROM posts p
  INNER JOIN post_media pm ON pm.post_id = p.id
  LEFT JOIN user_profiles up ON up.id = p.user_id
  LEFT JOIN business_accounts ba ON ba.id = p.actor_id AND p.actor_type = 'business'
  LEFT JOIN course_ratings cr ON cr.id = p.source_review_id
  LEFT JOIN golf_courses gc ON gc.id = cr.course_id
  WHERE p.status = 'published'
    AND (
      (v_actor_type = 'personal' AND p.user_id = v_actor_id AND (p.actor_type = 'personal' OR p.actor_type IS NULL))
      OR
      (v_actor_type = 'business' AND p.actor_type = 'business' AND p.actor_id = v_actor_id)
    )
    AND (v_cursor IS NULL OR p.created_at < v_cursor)
    AND NOT (p.id = ANY(v_seen_post_ids))
  ORDER BY p.created_at DESC, pm.display_order ASC
  LIMIT v_page_size;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 5) get_suggested_feed — add 4 breakdown columns
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_suggested_feed(uuid, integer, text, uuid[], text);

CREATE OR REPLACE FUNCTION public.get_suggested_feed(
  p_user_id uuid,
  p_page_size integer DEFAULT 10,
  p_cursor text DEFAULT NULL::text,
  p_seen_post_ids uuid[] DEFAULT '{}'::uuid[],
  p_mode text DEFAULT 'suggested'::text
)
RETURNS TABLE(
  post_id uuid, post_content text, post_created_at timestamp with time zone,
  post_user_id uuid, post_actor_type text, post_actor_id uuid,
  post_status text, source_review_id uuid,
  media_id uuid, media_type text, media_url text, poster_url text, stream_id text,
  duration_seconds numeric, width integer, height integer, display_order integer,
  creator_username text, creator_display_name text, creator_avatar_url text, creator_is_verified boolean,
  business_name text, business_logo_url text, business_is_verified boolean,
  like_count bigint, comment_count bigint, share_count bigint,
  review_rating numeric, review_course_id uuid, review_course_name text, review_course_image text,
  review_course_region text, review_course_country text, review_course_sub_country text,
  creator_relation text, is_liked_by_me boolean, is_followed_by_me boolean, engagement_score numeric,
  post_type text, tournament_meta jsonb, review_text text, post_tags jsonb,
  course_id uuid, course_name text,
  review_design_score numeric, review_condition_score numeric,
  review_facilities_score numeric, review_clubhouse_score numeric
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  v_cursor_ts timestamptz;
  v_mode text := COALESCE(p_mode, 'suggested');
  v_page_size integer := LEAST(COALESCE(p_page_size, 10), 60);
BEGIN
  IF p_cursor IS NOT NULL THEN
    v_cursor_ts := p_cursor::timestamptz;
  END IF;

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
        OR
        EXISTS (
          SELECT 1
          FROM post_media pm
          WHERE pm.post_id = p.id
            AND (
              (
                pm.media_type = 'video'
                AND pm.width IS NOT NULL
                AND pm.height IS NOT NULL
                AND pm.height > 0
                AND (pm.width::numeric / pm.height::numeric) <= 1.0
                AND (pm.duration_ms IS NULL OR pm.duration_ms >= 4000)
              )
              OR
              (
                pm.media_type = 'image'
                AND (
                  pm.width IS NULL
                  OR pm.height IS NULL
                  OR pm.width <= pm.height
                )
              )
            )
        )
      )
    ORDER BY p.created_at DESC
    LIMIT v_page_size * 40
  ),
  scored AS (
    SELECT
      c.*,
      CASE
        WHEN v_mode = 'popular' THEN
          (COALESCE(c.like_count, 0) * 1.0 + COALESCE(c.comment_count, 0) * 2.5)
          / (1.0 + EXTRACT(EPOCH FROM (now() - c.created_at)) / 86400.0)
        ELSE 0
      END AS calc_score,
      ROW_NUMBER() OVER (PARTITION BY c.p_uid ORDER BY c.created_at DESC) AS creator_rank
    FROM candidates c
  ),
  top_post_ids AS (
    SELECT s.id
    FROM scored s
    WHERE (v_mode <> 'popular' OR s.creator_rank <= 3)
    ORDER BY
      CASE WHEN v_mode = 'popular' THEN s.calc_score END DESC NULLS LAST,
      CASE WHEN v_mode <> 'popular' THEN
        CASE
          WHEN s.created_at > now() - interval '7 days'  THEN 0
          WHEN s.created_at > now() - interval '60 days' THEN 1
          ELSE 2
        END
      END ASC NULLS LAST,
      CASE WHEN v_mode <> 'popular' THEN random() END ASC NULLS LAST
    LIMIT v_page_size
  ),
  with_media AS (
    SELECT
      s.id                                                          AS wm_post_id,
      s.content                                                     AS wm_post_content,
      s.created_at                                                  AS wm_post_created_at,
      s.p_uid                                                       AS wm_post_user_id,
      s.actor_type                                                  AS wm_post_actor_type,
      s.actor_id                                                    AS wm_post_actor_id,
      s.status                                                      AS wm_post_status,
      s.source_review_id                                            AS wm_source_review_id,
      pm.id                                                         AS wm_media_id,
      pm.media_type                                                 AS wm_media_type,
      pm.media_url                                                  AS wm_media_url,
      pm.poster_url                                                 AS wm_poster_url,
      NULL::text                                                    AS wm_stream_id,
      pm.duration_ms::numeric / 1000.0                              AS wm_duration_seconds,
      pm.width                                                      AS wm_width,
      pm.height                                                     AS wm_height,
      pm.display_order                                              AS wm_display_order,
      up.username                                                   AS wm_creator_username,
      up.display_name                                               AS wm_creator_display_name,
      up.profile_photo_url                                          AS wm_creator_avatar_url,
      COALESCE(up.is_verified, FALSE)                               AS wm_creator_is_verified,
      ba.name                                                       AS wm_business_name,
      ba.logo_url                                                   AS wm_business_logo_url,
      COALESCE(ba.is_verified, FALSE)                               AS wm_business_is_verified,
      COALESCE(s.like_count, 0)::bigint                             AS wm_like_count,
      COALESCE(s.comment_count, 0)::bigint                          AS wm_comment_count,
      0::bigint                                                     AS wm_share_count,
      cr.rating                                                     AS wm_review_rating,
      cr.course_id                                                  AS wm_review_course_id,
      COALESCE(gc_review.name, gc_course.name)                      AS wm_review_course_name,
      COALESCE(gc_review.thumbnail_image, gc_course.thumbnail_image) AS wm_review_course_image,
      COALESCE(gc_review.region, gc_course.region)                  AS wm_review_course_region,
      COALESCE(gc_review.country, gc_course.country)                AS wm_review_course_country,
      COALESCE(gc_review.sub_country, gc_course.sub_country)        AS wm_review_course_sub_country,
      'none'::text                                                  AS wm_creator_relation,
      EXISTS (
        SELECT 1 FROM post_likes pl
        WHERE pl.post_id = s.id AND pl.user_id = p_user_id
      )                                                             AS wm_is_liked_by_me,
      EXISTS (
        SELECT 1 FROM user_follows uf
        WHERE uf.follower_id = p_user_id AND uf.following_id = s.p_uid
      )                                                             AS wm_is_followed_by_me,
      s.calc_score                                                  AS wm_engagement_score,
      COALESCE(s.post_type, 'post')                                 AS wm_post_type,
      NULL::jsonb                                                   AS wm_tournament_meta,
      cr.review                                                     AS wm_review_text,
      (
        SELECT jsonb_agg(jsonb_build_object(
          'tagged_entity_id', pt.tagged_entity_id,
          'tagged_entity_type', te.entity_type,
          'display_name', te.name,
          'slug', te.slug,
          'username', te.username
        ))
        FROM post_tags pt
        JOIN taggable_entities te ON te.id = pt.tagged_entity_id
        WHERE pt.post_id = s.id
          AND te.entity_type IN ('user', 'business', 'golf_club')
      )                                                             AS wm_post_tags,
      gc_course.id                                                  AS wm_course_id,
      gc_course.name                                                AS wm_course_name,
      cr.design_score                                               AS wm_review_design_score,
      cr.condition_score                                            AS wm_review_condition_score,
      cr.facilities_score                                           AS wm_review_facilities_score,
      cr.clubhouse_score                                            AS wm_review_clubhouse_score
    FROM scored s
    INNER JOIN top_post_ids tpi ON tpi.id = s.id
    LEFT JOIN user_profiles up ON up.id = s.p_uid
    LEFT JOIN business_accounts ba ON s.actor_type = 'business' AND ba.id = s.actor_id
    LEFT JOIN post_media pm ON pm.post_id = s.id
    LEFT JOIN course_ratings cr ON s.source_review_id IS NOT NULL AND cr.id = s.source_review_id
    LEFT JOIN golf_courses gc_review ON cr.course_id IS NOT NULL AND gc_review.id = cr.course_id
    LEFT JOIN golf_courses gc_course ON s.course_id IS NOT NULL AND gc_course.id = s.course_id
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
    wm.wm_review_facilities_score, wm.wm_review_clubhouse_score
  FROM with_media wm
  ORDER BY
    wm.wm_post_created_at DESC,
    wm.wm_display_order ASC;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 6) get_watch_shorts — add 4 breakdown columns
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_watch_shorts(uuid, text, integer, timestamp with time zone, uuid[], text, double precision, double precision, text, integer);

CREATE OR REPLACE FUNCTION public.get_watch_shorts(
  p_user_id uuid,
  p_mode text DEFAULT 'trending'::text,
  p_page_size integer DEFAULT 30,
  p_cursor timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_seen_ids uuid[] DEFAULT '{}'::uuid[],
  p_search_query text DEFAULT NULL::text,
  p_user_lat double precision DEFAULT NULL::double precision,
  p_user_lng double precision DEFAULT NULL::double precision,
  p_category text DEFAULT NULL::text,
  p_max_duration integer DEFAULT NULL::integer
)
RETURNS TABLE(
  post_id uuid, post_content text, post_created_at timestamp with time zone,
  post_user_id uuid, post_actor_type text, post_actor_id uuid,
  post_status text, source_review_id uuid,
  media_id uuid, media_type text, media_url text, poster_url text, stream_id text,
  duration_seconds numeric, width integer, height integer, display_order integer,
  creator_username text, creator_display_name text, creator_avatar_url text, creator_is_verified boolean,
  business_name text, business_logo_url text, business_is_verified boolean,
  like_count bigint, comment_count bigint, share_count bigint,
  review_rating numeric, review_course_id uuid, review_course_name text, review_course_image text,
  course_region text, course_country text,
  creator_relation text, is_liked_by_me boolean, is_followed_by_me boolean, engagement_score numeric,
  review_design_score numeric, review_condition_score numeric,
  review_facilities_score numeric, review_clubhouse_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_max_duration INT := COALESCE(p_max_duration, 180);
BEGIN
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
      CASE WHEN ml.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS p_liked_by_me,
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
      (1.0 + 0.10 * (LEAST(GREATEST(COALESCE(cqs.quality_score, 0), 0), 50) / 50.0 - 0.5)) AS creator_quality_factor
    FROM posts p
    INNER JOIN post_media pm ON pm.post_id = p.id
    LEFT JOIN user_profiles up ON up.id = p.user_id
    LEFT JOIN business_accounts ba ON ba.id = p.actor_id AND p.actor_type = 'business'
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_likes lk WHERE lk.post_id = p.id) plc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_comments cm WHERE cm.post_id = p.id) pcc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_shares sh WHERE sh.post_id = p.id) psc ON TRUE
    LEFT JOIN my_friends mfr ON mfr.uid = p.user_id
    LEFT JOIN my_follows mfl ON mfl.uid = p.user_id
    LEFT JOIN my_business_follows mbf ON mbf.bid = p.actor_id AND p.actor_type = 'business'
    LEFT JOIN blocked_users bu ON bu.uid = p.user_id
    LEFT JOIN dismissed d ON d.pid = p.id
    LEFT JOIN post_likes ml ON ml.post_id = p.id AND ml.user_id = p_user_id
    LEFT JOIN course_ratings cr ON cr.id = p.source_review_id
    LEFT JOIN golf_courses gc ON gc.id = COALESCE(cr.course_id, p.course_id)
    LEFT JOIN creator_dismissals cd ON cd.creator_uid = p.user_id
    LEFT JOIN creator_quality_scores cqs ON cqs.user_id = p.user_id
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
        ELSE 0
      END AS base_score
    FROM candidates c
  ),
  scored_final AS (
    SELECT s.*,
      CASE p_mode
        WHEN 'trending' THEN s.base_score * s.duration_quality * s.creator_deprio * s.creator_quality_factor
        WHEN 'top'      THEN s.base_score * s.duration_quality * s.creator_deprio * s.creator_quality_factor
        ELSE s.base_score * s.creator_deprio
      END AS score
    FROM scored s
  ),
  filtered AS (
    SELECT * FROM scored_final
    ORDER BY score DESC
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
    f.p_review_facilities_score, f.p_review_clubhouse_score
  FROM filtered f
  ORDER BY f.score DESC;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 7) get_reviewer_stats — new RPC
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_reviewer_stats(p_user_id uuid)
RETURNS TABLE(
  courses_rated bigint,
  avg_rating numeric,
  member_since text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::bigint AS courses_rated,
    ROUND(AVG(rating)::numeric, 1) AS avg_rating,
    EXTRACT(YEAR FROM MIN(created_at))::text AS member_since
  FROM course_ratings
  WHERE user_id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_reviewer_stats(uuid) TO anon, authenticated;
