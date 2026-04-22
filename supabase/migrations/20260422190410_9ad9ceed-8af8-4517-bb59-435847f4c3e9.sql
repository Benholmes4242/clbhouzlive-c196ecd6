-- =====================================================================
-- Phase 3 — Videos subpage RPC extensions
--
-- 1) get_continue_watching: add p_format ('clip'|'video'|NULL) so the
--    Videos subpage can render only long-form (>90s) in-progress posts
--    while the existing Watch tab continues to receive mixed content.
--
-- 2) get_long_form_videos: add p_category text so the category rail and
--    category-filtered bottom feed can narrow to a single MOMENT_CATEGORY
--    id (e.g. 'course-vlog', 'tips-coaching', 'tournament').
--
-- Both parameters default to NULL → all existing call sites unchanged.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) get_continue_watching: add p_format
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_continue_watching(
  p_user_id uuid,
  p_limit   integer DEFAULT 10,
  p_format  text    DEFAULT NULL
)
RETURNS TABLE (
  post_id uuid,
  post_content text,
  post_created_at timestamptz,
  post_user_id uuid,
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
  like_count integer,
  comment_count integer,
  share_count integer,
  progress_seconds integer,
  total_seconds integer,
  last_interaction_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_format text := NULLIF(p_format, '');
BEGIN
  RETURN QUERY
  WITH primary_media AS (
    SELECT
      pm.post_id,
      pm.id            AS media_id,
      pm.media_type,
      pm.media_url,
      pm.poster_url,
      pm.stream_id,
      pm.duration_seconds,
      pm.width,
      pm.height,
      pm.display_order,
      ROW_NUMBER() OVER (
        PARTITION BY pm.post_id
        ORDER BY pm.display_order ASC NULLS LAST, pm.created_at ASC
      ) AS rn
    FROM public.post_media pm
    WHERE pm.media_type = 'video'
  ),
  progress AS (
    SELECT
      vp.post_id,
      vp.progress_seconds,
      vp.total_seconds,
      vp.updated_at AS last_interaction_at,
      ROW_NUMBER() OVER (
        PARTITION BY vp.post_id
        ORDER BY vp.updated_at DESC
      ) AS rn
    FROM public.video_progress vp
    WHERE vp.user_id = p_user_id
      -- "in-progress" = at least 5s watched but not finished
      AND vp.progress_seconds >= 5
      AND (vp.total_seconds IS NULL OR vp.progress_seconds < vp.total_seconds - 10)
  )
  SELECT
    p.id                              AS post_id,
    p.content                         AS post_content,
    p.created_at                      AS post_created_at,
    p.user_id                         AS post_user_id,
    pm.media_id                       AS media_id,
    pm.media_type                     AS media_type,
    pm.media_url                      AS media_url,
    pm.poster_url                     AS poster_url,
    pm.stream_id                      AS stream_id,
    pm.duration_seconds               AS duration_seconds,
    pm.width                          AS width,
    pm.height                         AS height,
    pm.display_order                  AS display_order,
    up.username                       AS creator_username,
    up.display_name                   AS creator_display_name,
    up.avatar_url                     AS creator_avatar_url,
    COALESCE(up.is_verified, false)   AS creator_is_verified,
    COALESCE(p.like_count, 0)         AS like_count,
    COALESCE(p.comment_count, 0)      AS comment_count,
    0                                 AS share_count,
    pr.progress_seconds               AS progress_seconds,
    COALESCE(pr.total_seconds, pm.duration_seconds::int) AS total_seconds,
    pr.last_interaction_at            AS last_interaction_at
  FROM progress pr
  JOIN public.posts p             ON p.id = pr.post_id AND p.status = 'published'
  JOIN primary_media pm           ON pm.post_id = p.id AND pm.rn = 1
  LEFT JOIN public.user_profiles up ON up.id = p.user_id
  WHERE pr.rn = 1
    AND (
      v_format IS NULL
      OR (v_format = 'video' AND pm.duration_seconds > 90)
      OR (v_format = 'clip'  AND pm.duration_seconds <= 90)
    )
  ORDER BY pr.last_interaction_at DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_continue_watching(uuid, integer, text) TO anon, authenticated;

-- ---------------------------------------------------------------------
-- 2) get_long_form_videos: add p_category
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_long_form_videos(
  p_user_id        uuid,
  p_mode           text                     DEFAULT 'latest',
  p_page_size      integer                  DEFAULT 10,
  p_cursor         timestamp with time zone DEFAULT NULL,
  p_seen_post_ids  uuid[]                   DEFAULT '{}'::uuid[],
  p_search_query   text                     DEFAULT NULL,
  p_category       text                     DEFAULT NULL
)
RETURNS TABLE (
  post_id uuid,
  post_user_id uuid,
  post_content text,
  post_created_at timestamptz,
  actor_type text,
  actor_id uuid,
  creator_username text,
  creator_display_name text,
  creator_avatar_url text,
  creator_is_verified boolean,
  creator_relation text,
  course_id uuid,
  course_name text,
  media_id uuid,
  media_type text,
  media_url text,
  hls_url text,
  poster_url text,
  stream_id text,
  width integer,
  height integer,
  duration_seconds numeric,
  display_order integer,
  like_count integer,
  comment_count integer,
  share_count integer,
  is_liked_by_me boolean,
  is_followed_by_me boolean,
  review_id uuid,
  review_overall_score numeric,
  review_categories jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mode     text := COALESCE(NULLIF(p_mode, ''),    'latest');
  v_search   text := NULLIF(p_search_query, '');
  v_category text := NULLIF(p_category,     '');
BEGIN
  RETURN QUERY
  WITH primary_media AS (
    SELECT
      pm.post_id,
      pm.id              AS media_id,
      pm.media_type,
      pm.media_url,
      pm.hls_url,
      pm.poster_url,
      pm.stream_id,
      pm.width,
      pm.height,
      pm.duration_seconds,
      pm.display_order,
      ROW_NUMBER() OVER (
        PARTITION BY pm.post_id
        ORDER BY pm.display_order ASC NULLS LAST, pm.created_at ASC
      ) AS rn
    FROM public.post_media pm
    WHERE pm.media_type = 'video'
      AND pm.duration_seconds > 90
  ),
  base AS (
    SELECT
      p.id                AS post_id,
      p.user_id           AS post_user_id,
      p.content           AS post_content,
      p.created_at        AS post_created_at,
      COALESCE(p.actor_type, 'personal') AS actor_type,
      COALESCE(p.actor_id, p.user_id)    AS actor_id,
      up.username         AS creator_username,
      up.display_name     AS creator_display_name,
      up.avatar_url       AS creator_avatar_url,
      COALESCE(up.is_verified, false) AS creator_is_verified,
      'none'::text        AS creator_relation,
      p.course_id,
      gc.name             AS course_name,
      pm.media_id,
      pm.media_type,
      pm.media_url,
      pm.hls_url,
      pm.poster_url,
      pm.stream_id,
      pm.width,
      pm.height,
      pm.duration_seconds,
      pm.display_order,
      COALESCE(p.like_count, 0)    AS like_count,
      COALESCE(p.comment_count, 0) AS comment_count,
      0                             AS share_count,
      EXISTS (
        SELECT 1 FROM public.post_likes pl
        WHERE pl.post_id = p.id
          AND pl.actor_id = p_user_id
          AND pl.actor_type = 'personal'
      ) AS is_liked_by_me,
      EXISTS (
        SELECT 1 FROM public.user_follows uf
        WHERE uf.follower_id = p_user_id
          AND uf.following_id = p.user_id
      ) AS is_followed_by_me,
      NULL::uuid           AS review_id,
      NULL::numeric        AS review_overall_score,
      NULL::jsonb          AS review_categories
    FROM public.posts p
    JOIN primary_media pm  ON pm.post_id = p.id AND pm.rn = 1
    LEFT JOIN public.user_profiles up ON up.id = p.user_id
    LEFT JOIN public.golf_courses   gc ON gc.id = p.course_id
    WHERE p.status = 'published'
      AND (
        p.visibility = 'anyone'
        OR (
          p.visibility = 'followers'
          AND EXISTS (
            SELECT 1 FROM public.user_follows uf
            WHERE uf.follower_id = p_user_id
              AND uf.following_id = p.user_id
          )
        )
        OR p.user_id = p_user_id
      )
      AND (
        v_search IS NULL
        OR p.content ILIKE '%' || v_search || '%'
        OR up.display_name ILIKE '%' || v_search || '%'
        OR up.username     ILIKE '%' || v_search || '%'
        OR gc.name         ILIKE '%' || v_search || '%'
      )
      AND (v_category IS NULL OR p.categories @> ARRAY[v_category])
      AND (p_cursor IS NULL OR p.created_at < p_cursor)
      AND (p_seen_post_ids IS NULL OR NOT (p.id = ANY(p_seen_post_ids)))
      AND (
        v_mode <> 'following'
        OR EXISTS (
          SELECT 1 FROM public.user_follows uf
          WHERE uf.follower_id = p_user_id
            AND uf.following_id = p.user_id
        )
      )
  )
  SELECT
    b.post_id,
    b.post_user_id,
    b.post_content,
    b.post_created_at,
    b.actor_type,
    b.actor_id,
    b.creator_username,
    b.creator_display_name,
    b.creator_avatar_url,
    b.creator_is_verified,
    b.creator_relation,
    b.course_id,
    b.course_name,
    b.media_id,
    b.media_type,
    b.media_url,
    b.hls_url,
    b.poster_url,
    b.stream_id,
    b.width,
    b.height,
    b.duration_seconds,
    b.display_order,
    b.like_count,
    b.comment_count,
    b.share_count,
    b.is_liked_by_me,
    b.is_followed_by_me,
    b.review_id,
    b.review_overall_score,
    b.review_categories
  FROM base b
  ORDER BY
    CASE WHEN v_mode = 'popular' THEN b.like_count + b.comment_count * 2 END DESC NULLS LAST,
    b.post_created_at DESC
  LIMIT p_page_size;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_long_form_videos(uuid, text, integer, timestamp with time zone, uuid[], text, text) TO anon, authenticated;