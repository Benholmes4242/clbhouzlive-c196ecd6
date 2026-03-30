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
  post_id uuid,
  post_content text,
  post_created_at timestamp with time zone,
  post_user_id uuid,
  post_actor_type text,
  post_actor_id uuid,
  post_status text,
  source_review_id uuid,
  media_id uuid,
  media_type text,
  media_url text,
  poster_url text,
  stream_id text,
  duration_seconds numeric,
  width integer,
  height integer,
  display_order integer,
  creator_username text,
  creator_display_name text,
  creator_avatar_url text,
  creator_is_verified boolean,
  business_name text,
  business_logo_url text,
  business_is_verified boolean,
  like_count bigint,
  comment_count bigint,
  share_count bigint,
  review_rating numeric,
  review_course_id uuid,
  review_course_name text,
  review_course_image text,
  review_course_region text,
  review_course_country text,
  review_course_sub_country text,
  course_region text,
  course_country text,
  creator_relation text,
  is_liked_by_me boolean,
  is_followed_by_me boolean,
  engagement_score numeric,
  review_text text,
  post_tags jsonb,
  course_id uuid,
  course_name text
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
    SELECT blocked_id AS uid FROM user_blocks WHERE blocker_id = v_user_id
    UNION
    SELECT blocker_id AS uid FROM user_blocks WHERE blocked_id = v_user_id
  ),
  raw_posts AS (
    SELECT DISTINCT ON (p.id)
      p.id, p.content, p.created_at, p.user_id, p.actor_type, p.actor_id,
      p.status, p.source_review_id, p.course_id,
      pm.id AS pm_id, pm.media_type AS pm_media_type, pm.media_url AS pm_media_url,
      pm.poster_url AS pm_poster_url, pm.stream_id AS pm_stream_id,
      pm.duration_seconds::numeric AS pm_duration, pm.width AS pm_width, pm.height AS pm_height,
      pm.display_order AS pm_display_order, sg.rel AS sg_rel, sg.target_type AS sg_target_type
    FROM posts p
    INNER JOIN post_media pm ON pm.post_id = p.id
    INNER JOIN social_graph sg ON (
      (sg.target_type = 'personal' AND p.user_id = sg.target_user_id)
      OR (sg.target_type = 'business' AND p.actor_type = 'business' AND p.actor_id = sg.target_user_id)
    )
    WHERE p.status = 'published'
      AND p.user_id NOT IN (SELECT uid FROM blocked_users)
      AND (v_cursor IS NULL OR p.created_at < v_cursor)
      AND (cardinality(v_seen_post_ids) = 0 OR p.id != ALL(v_seen_post_ids))
      AND (
        v_search_pattern IS NULL
        OR lower(p.content) LIKE v_search_pattern
        OR lower(COALESCE((SELECT up.display_name FROM user_profiles up WHERE up.id = p.user_id), '')) LIKE v_search_pattern
      )
    ORDER BY p.id, pm.display_order
  ),
  scored AS (
    SELECT rp.*,
      (SELECT count(*) FROM post_likes pl WHERE pl.post_id = rp.id) AS plc,
      (SELECT count(*) FROM post_comments pc WHERE pc.post_id = rp.id) AS pcc,
      (SELECT count(*) FROM post_shares ps WHERE ps.post_id = rp.id) AS psc,
      CASE WHEN v_mode = 'popular' THEN
        (
          (SELECT count(*) FROM post_likes pl WHERE pl.post_id = rp.id) * 1.0
          + (SELECT count(*) FROM post_comments pc WHERE pc.post_id = rp.id) * 2.5
          + (SELECT count(*) FROM post_shares ps WHERE ps.post_id = rp.id) * 3.0
        ) * POWER(0.5, EXTRACT(EPOCH FROM (now() - rp.created_at)) / 3600.0 / 48.0)
      ELSE 0 END AS score,
      ROW_NUMBER() OVER (PARTITION BY rp.user_id ORDER BY rp.created_at DESC) AS creator_rank
    FROM raw_posts rp
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
    gc_course.name AS course_name
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