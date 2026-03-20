-- Drop and recreate get_suggested_feed with 5 algorithm fixes:
-- 1. Include photo posts in candidates
-- 2. Fix tour priority sort (DESC → ASC)
-- 3. Multiplicative social boosts instead of additive
-- 4. Creator cap 10 → 3
-- 5. Fetch multiplier 3× → 5×

DROP FUNCTION IF EXISTS public.get_suggested_feed(uuid, integer, timestamptz, uuid[]);

CREATE OR REPLACE FUNCTION public.get_suggested_feed(p_user_id uuid, p_page_size integer DEFAULT 10, p_cursor timestamp with time zone DEFAULT NULL::timestamp with time zone, p_seen_post_ids uuid[] DEFAULT '{}'::uuid[])
 RETURNS TABLE(post_id uuid, post_content text, post_created_at timestamp with time zone, post_user_id uuid, post_actor_type text, post_actor_id uuid, post_status text, source_review_id uuid, media_id uuid, media_type text, media_url text, poster_url text, stream_id text, duration_seconds numeric, width integer, height integer, display_order integer, creator_username text, creator_display_name text, creator_avatar_url text, creator_is_verified boolean, business_name text, business_logo_url text, business_is_verified boolean, like_count bigint, comment_count bigint, share_count bigint, review_rating numeric, review_course_id uuid, review_course_name text, review_course_image text, review_course_region text, review_course_country text, review_course_sub_country text, creator_relation text, is_liked_by_me boolean, is_followed_by_me boolean, engagement_score numeric, post_type text, tournament_meta jsonb, review_text text, post_tags jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_recency_halflife_hours NUMERIC := 24;
  v_max_post_age_days INT := 365;
  v_max_duration_seconds INT := 180;
  v_creator_cap INT := 3;
  v_fetch_multiplier INT := 5;
BEGIN
  RETURN QUERY
  WITH
  my_friends AS (
    SELECT uf1.friend_id AS uid FROM user_friends uf1
    WHERE uf1.user_id = p_user_id AND uf1.status = 'accepted'
    UNION
    SELECT uf2.user_id AS uid FROM user_friends uf2
    WHERE uf2.friend_id = p_user_id AND uf2.status = 'accepted'
  ),
  my_follows AS (
    SELECT ufl.following_id AS uid FROM user_follows ufl
    WHERE ufl.follower_id = p_user_id
  ),
  my_business_follows AS (
    SELECT bf.business_id AS bid FROM business_follows bf
    WHERE bf.follower_id = p_user_id
  ),
  blocked_users AS (
    SELECT ub.blocked_id AS uid FROM user_blocks ub
    WHERE ub.blocker_id = p_user_id
    UNION
    SELECT ub2.blocker_id AS uid FROM user_blocks ub2
    WHERE ub2.blocked_id = p_user_id
  ),
  candidates AS (
    SELECT
      p.id AS p_id,
      p.content AS p_content,
      p.created_at AS p_created_at,
      p.user_id AS p_user_id,
      p.actor_type AS p_actor_type,
      p.actor_id AS p_actor_id,
      p.status AS p_status,
      p.source_review_id AS p_source_review_id,
      pm.id AS pm_id,
      pm.media_type AS pm_media_type,
      pm.media_url AS pm_media_url,
      pm.poster_url AS pm_poster_url,
      pm.stream_id AS pm_stream_id,
      pm.duration_seconds AS pm_duration,
      pm.width AS pm_width,
      pm.height AS pm_height,
      pm.display_order AS pm_display_order,
      COALESCE(lc.cnt, 0) AS p_like_count,
      COALESCE(cc.cnt, 0) AS p_comment_count,
      COALESCE(sc.cnt, 0) AS p_share_count,
      CASE
        WHEN mf.uid IS NOT NULL THEN 'friend'
        WHEN mfl.uid IS NOT NULL THEN 'following'
        WHEN mbf.bid IS NOT NULL AND p.actor_type = 'business' THEN 'following'
        ELSE 'none'
      END AS p_relation,
      CASE WHEN ml.post_id IS NOT NULL THEN TRUE ELSE FALSE END AS p_liked_by_me,
      CASE
        WHEN mfl.uid IS NOT NULL THEN TRUE
        WHEN mbf.bid IS NOT NULL AND p.actor_type = 'business' THEN TRUE
        ELSE FALSE
      END AS p_followed_by_me,
      cr.rating AS p_review_rating,
      gc.id AS p_review_course_id,
      gc.name AS p_review_course_name,
      gc.thumbnail_image AS p_review_course_image,
      gc.region AS p_review_course_region,
      gc.country AS p_review_course_country,
      gc.sub_country AS p_review_course_sub_country,
      up.username AS p_creator_username,
      up.display_name AS p_creator_display_name,
      up.profile_photo_url AS p_creator_avatar,
      COALESCE(up.is_verified, FALSE) AS p_creator_verified,
      ba.name AS p_business_name,
      ba.logo_url AS p_business_logo,
      COALESCE(ba.is_verified, FALSE) AS p_business_verified,
      p.post_type AS p_post_type,
      NULL::jsonb AS p_tournament_meta,
      cr.review AS p_review_text
    FROM posts p
    INNER JOIN post_media pm ON pm.post_id = p.id
    LEFT JOIN user_profiles up ON up.id = p.user_id
    LEFT JOIN business_accounts ba ON ba.id = p.actor_id AND p.actor_type = 'business'
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_likes pl WHERE pl.post_id = p.id) lc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_comments pc WHERE pc.post_id = p.id) cc ON TRUE
    LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM post_shares ps WHERE ps.post_id = p.id) sc ON TRUE
    LEFT JOIN my_friends mf ON mf.uid = p.user_id
    LEFT JOIN my_follows mfl ON mfl.uid = p.user_id
    LEFT JOIN my_business_follows mbf ON mbf.bid = p.actor_id AND p.actor_type = 'business'
    LEFT JOIN blocked_users bu ON bu.uid = p.user_id
    LEFT JOIN post_likes ml ON ml.post_id = p.id AND ml.user_id = p_user_id
    LEFT JOIN course_ratings cr ON cr.id = p.source_review_id
    LEFT JOIN golf_courses gc ON gc.id = cr.course_id
    WHERE p.status = 'published'
      AND bu.uid IS NULL
      AND p.created_at > NOW() - INTERVAL '365 days'
      AND (p_cursor IS NULL OR p.created_at < p_cursor)
      AND NOT (p.id = ANY(p_seen_post_ids))
      AND (COALESCE(p.post_type, 'standard') != 'tournament_result')
      AND (
        (p.source_review_id IS NULL AND (
          pm.media_type = 'image'
          OR (pm.media_type = 'video' AND pm.duration_seconds IS NOT NULL AND pm.duration_seconds <= v_max_duration_seconds)
        ))
        OR (p.source_review_id IS NOT NULL)
      )
    ORDER BY p.created_at DESC
    LIMIT p_page_size * v_fetch_multiplier
  ),
  scored AS (
    SELECT c.*,
      (
        (c.p_like_count * 1.0 + c.p_comment_count * 2.5 + c.p_share_count * 3.0 + 1.0)
        * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - c.p_created_at)) / 3600 / v_recency_halflife_hours)
        * CASE WHEN c.p_relation = 'friend'    THEN 1.5
               WHEN c.p_relation = 'following' THEN 1.2
               ELSE 1.0 END
      ) AS score,
      ROW_NUMBER() OVER (
        PARTITION BY c.p_user_id
        ORDER BY (
          (c.p_like_count * 1.0 + c.p_comment_count * 2.5 + c.p_share_count * 3.0 + 1.0)
          * POWER(0.5, EXTRACT(EPOCH FROM (NOW() - c.p_created_at)) / 3600 / v_recency_halflife_hours)
        ) DESC
      ) AS creator_rank
    FROM candidates c
  ),
  filtered AS (
    SELECT * FROM scored
    WHERE creator_rank <= v_creator_cap
    ORDER BY score DESC
    LIMIT p_page_size
  ),
  tournament_card AS (
    SELECT
      tp.id AS p_id, NULL::text AS p_content, tp.created_at AS p_created_at,
      tp.user_id AS p_user_id, COALESCE(tp.actor_type, 'system')::text AS p_actor_type,
      tp.actor_id AS p_actor_id, tp.status AS p_status,
      NULL::uuid AS p_source_review_id, NULL::uuid AS pm_id,
      NULL::text AS pm_media_type, NULL::text AS pm_media_url,
      NULL::text AS pm_poster_url, NULL::text AS pm_stream_id,
      NULL::numeric AS pm_duration, NULL::int AS pm_width,
      NULL::int AS pm_height, NULL::int AS pm_display_order,
      0::bigint AS p_like_count, 0::bigint AS p_comment_count, 0::bigint AS p_share_count,
      'system'::text AS p_relation, FALSE AS p_liked_by_me, FALSE AS p_followed_by_me,
      NULL::numeric AS p_review_rating, NULL::uuid AS p_review_course_id,
      NULL::text AS p_review_course_name, NULL::text AS p_review_course_image,
      NULL::text AS p_review_course_region, NULL::text AS p_review_course_country,
      NULL::text AS p_review_course_sub_country,
      'clbhouz'::text AS p_creator_username, 'Clbhouz'::text AS p_creator_display_name,
      NULL::text AS p_creator_avatar, TRUE AS p_creator_verified,
      NULL::text AS p_business_name, NULL::text AS p_business_logo, FALSE AS p_business_verified,
      tp.post_type AS p_post_type, row_to_json(trm.*)::jsonb AS p_tournament_meta,
      NULL::text AS p_review_text,
      (CASE
        WHEN EXTRACT(EPOCH FROM (now() - tp.created_at))/3600 < 6 THEN trm.tour_priority * 1.0
        WHEN EXTRACT(EPOCH FROM (now() - tp.created_at))/3600 < 24 THEN trm.tour_priority * 0.5
        WHEN EXTRACT(EPOCH FROM (now() - tp.created_at))/3600 < 72
          THEN (COALESCE(tp.like_count,0)*1.0 + COALESCE(tp.comment_count,0)*2.5) * EXP(-0.693 * EXTRACT(EPOCH FROM (now()-tp.created_at))/3600/24)
        ELSE (COALESCE(tp.like_count,0)*1.0 + COALESCE(tp.comment_count,0)*2.5) * EXP(-0.693 * EXTRACT(EPOCH FROM (now()-tp.created_at))/3600/48)
      END)::numeric AS score,
      1::bigint AS creator_rank
    FROM posts tp
    JOIN tournament_result_meta trm ON trm.post_id = tp.id
    WHERE tp.post_type = 'tournament_result' AND tp.status = 'published' AND tp.created_at > now() - interval '5 days'
    ORDER BY CASE WHEN tp.id = ANY(p_seen_post_ids) THEN 1 ELSE 0 END ASC, trm.tour_priority ASC
    LIMIT 1
  ),
  combined AS (
    SELECT f.p_id, f.p_content, f.p_created_at, f.p_user_id, f.p_actor_type, f.p_actor_id,
      f.p_status, f.p_source_review_id, f.pm_id, f.pm_media_type, f.pm_media_url,
      f.pm_poster_url, f.pm_stream_id, f.pm_duration, f.pm_width, f.pm_height,
      f.pm_display_order, f.p_like_count, f.p_comment_count, f.p_share_count,
      f.p_relation, f.p_liked_by_me, f.p_followed_by_me,
      f.p_review_rating, f.p_review_course_id, f.p_review_course_name,
      f.p_review_course_image, f.p_review_course_region, f.p_review_course_country,
      f.p_review_course_sub_country, f.p_creator_username, f.p_creator_display_name,
      f.p_creator_avatar, f.p_creator_verified, f.p_business_name, f.p_business_logo,
      f.p_business_verified, f.p_post_type, f.p_tournament_meta, f.p_review_text, f.score
    FROM filtered f
    UNION ALL
    SELECT t.p_id, t.p_content, t.p_created_at, t.p_user_id, t.p_actor_type, t.p_actor_id,
      t.p_status, t.p_source_review_id, t.pm_id, t.pm_media_type, t.pm_media_url,
      t.pm_poster_url, t.pm_stream_id, t.pm_duration, t.pm_width, t.pm_height,
      t.pm_display_order, t.p_like_count, t.p_comment_count, t.p_share_count,
      t.p_relation, t.p_liked_by_me, t.p_followed_by_me,
      t.p_review_rating, t.p_review_course_id, t.p_review_course_name,
      t.p_review_course_image, t.p_review_course_region, t.p_review_course_country,
      t.p_review_course_sub_country, t.p_creator_username, t.p_creator_display_name,
      t.p_creator_avatar, t.p_creator_verified, t.p_business_name, t.p_business_logo,
      t.p_business_verified, t.p_post_type, t.p_tournament_meta, t.p_review_text, t.score
    FROM tournament_card t
  )
  SELECT ranked.p_id, ranked.p_content, ranked.p_created_at, ranked.p_user_id,
    ranked.p_actor_type, ranked.p_actor_id, ranked.p_status, ranked.p_source_review_id,
    ranked.pm_id, ranked.pm_media_type, ranked.pm_media_url, ranked.pm_poster_url,
    ranked.pm_stream_id, ranked.pm_duration, ranked.pm_width, ranked.pm_height,
    ranked.pm_display_order, ranked.p_creator_username, ranked.p_creator_display_name,
    ranked.p_creator_avatar, ranked.p_creator_verified, ranked.p_business_name,
    ranked.p_business_logo, ranked.p_business_verified, ranked.p_like_count,
    ranked.p_comment_count, ranked.p_share_count, ranked.p_review_rating,
    ranked.p_review_course_id, ranked.p_review_course_name, ranked.p_review_course_image,
    ranked.p_review_course_region, ranked.p_review_course_country, ranked.p_review_course_sub_country,
    ranked.p_relation, ranked.p_liked_by_me, ranked.p_followed_by_me, ranked.score,
    ranked.p_post_type, ranked.p_tournament_meta, ranked.p_review_text,
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
       WHERE pt.post_id = ranked.p_id
         AND te.entity_type IN ('user', 'business')
      ), '[]'::jsonb
    ) AS post_tags
  FROM (
    SELECT c.*, ROW_NUMBER() OVER (ORDER BY
      CASE WHEN c.p_post_type = 'tournament_result' THEN 1 ELSE 0 END ASC, c.score DESC
    ) AS rn,
    COUNT(*) FILTER (WHERE c.p_post_type != 'tournament_result') OVER () AS regular_count
    FROM combined c
  ) ranked
  ORDER BY CASE
    WHEN ranked.p_post_type = 'tournament_result' AND ranked.regular_count < 3 THEN 999
    WHEN ranked.p_post_type = 'tournament_result' THEN 4
    ELSE ranked.rn
  END ASC;
END;
$function$;