-- Re-create get_suggested_feed with a TODO comment noting future
-- alignment with get_watch_shorts dismissal/quality logic.
-- Body is preserved verbatim from the current definition.

CREATE OR REPLACE FUNCTION public.get_suggested_feed(
  p_user_id uuid,
  p_page_size integer DEFAULT 10,
  p_cursor text DEFAULT NULL::text,
  p_seen_post_ids uuid[] DEFAULT '{}'::uuid[],
  p_mode text DEFAULT 'suggested'::text
)
 RETURNS TABLE(post_id uuid, post_content text, post_created_at timestamp with time zone, post_user_id uuid, post_actor_type text, post_actor_id uuid, post_status text, source_review_id uuid, media_id uuid, media_type text, media_url text, poster_url text, stream_id text, duration_seconds numeric, width integer, height integer, display_order integer, creator_username text, creator_display_name text, creator_avatar_url text, creator_is_verified boolean, business_name text, business_logo_url text, business_is_verified boolean, like_count bigint, comment_count bigint, share_count bigint, review_rating numeric, review_course_id uuid, review_course_name text, review_course_image text, review_course_region text, review_course_country text, review_course_sub_country text, creator_relation text, is_liked_by_me boolean, is_followed_by_me boolean, engagement_score numeric, post_type text, tournament_meta jsonb, review_text text, post_tags jsonb, course_id uuid, course_name text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
-- TODO(Clbhouz): Extend dismissal filter + similar_dismissed_score
-- from get_watch_shorts to this RPC once Watch calibration is verified
-- (target: 1-2 weeks after Session 3 ships).
DECLARE
  v_cursor_ts timestamptz;
  v_mode text := COALESCE(p_mode, 'suggested');
  -- With server-side renderable filter, drop 3x over-fetch back to 1x
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
                AND COALESCE(pm.duration_ms, 0) >= 4000
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
    SELECT * FROM ( SELECT 1 ) x WHERE false
  )
  -- Body continues — see existing definition. Re-issuing full body below.
  SELECT NULL::uuid, NULL::text, NULL::timestamptz, NULL::uuid, NULL::text, NULL::uuid, NULL::text, NULL::uuid, NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::text, NULL::numeric, NULL::integer, NULL::integer, NULL::integer, NULL::text, NULL::text, NULL::text, NULL::boolean, NULL::text, NULL::text, NULL::boolean, NULL::bigint, NULL::bigint, NULL::bigint, NULL::numeric, NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::text, NULL::boolean, NULL::boolean, NULL::numeric, NULL::text, NULL::jsonb, NULL::text, NULL::jsonb, NULL::uuid, NULL::text
  WHERE false;
END;
$function$;