CREATE OR REPLACE FUNCTION public.get_continue_watching(p_user_id uuid, p_limit integer DEFAULT 10, p_format text DEFAULT NULL::text)
 RETURNS TABLE(post_id uuid, post_content text, post_created_at timestamp with time zone, post_user_id uuid, media_id uuid, media_type text, media_url text, poster_url text, stream_id text, duration_seconds numeric, width integer, height integer, display_order integer, creator_username text, creator_display_name text, creator_avatar_url text, creator_is_verified boolean, like_count bigint, comment_count bigint, share_count bigint, progress_seconds integer, total_seconds integer, last_interaction_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_format text := NULLIF(p_format, '');
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.content, p.created_at, p.user_id,
    pm.id, pm.media_type, pm.media_url, pm.poster_url, pm.stream_id,
    pm.duration_seconds, pm.width, pm.height, pm.display_order,
    up.username, up.display_name, up.profile_photo_url,
    COALESCE(up.is_verified, FALSE),
    COALESCE(plc.cnt, 0), COALESCE(pcc.cnt, 0), COALESCE(psc.cnt, 0),
    ucp.progress_seconds, ucp.total_seconds, ucp.last_interaction_at
  FROM public.user_content_preferences ucp
  INNER JOIN public.posts p ON p.id = ucp.post_id AND p.status = 'published'
  INNER JOIN public.post_media pm
    ON pm.post_id = p.id
    AND pm.derived_format IN ('clip', 'video')
    AND pm.processing_status = 'complete'
    -- Phase 4b: optional format filter (NULL = both, 'clip' or 'video' = specific)
    AND (v_format IS NULL OR pm.derived_format = v_format)
  LEFT JOIN public.user_profiles up ON up.id = p.user_id
  LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM public.post_likes lk WHERE lk.post_id = p.id) plc ON TRUE
  LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM public.post_comments cm WHERE cm.post_id = p.id) pcc ON TRUE
  LEFT JOIN LATERAL (SELECT COUNT(*) AS cnt FROM public.post_shares sh WHERE sh.post_id = p.id) psc ON TRUE
  LEFT JOIN public.user_content_preferences dismissed
    ON dismissed.user_id = p_user_id AND dismissed.post_id = p.id AND dismissed.signal_type = 'dismissed'
  LEFT JOIN public.user_content_preferences complete
    ON complete.user_id = p_user_id AND complete.post_id = p.id AND complete.signal_type = 'watched_complete'
  WHERE ucp.user_id = p_user_id
    AND ucp.signal_type = 'watched_partial'
    AND ucp.last_interaction_at > NOW() - INTERVAL '30 days'
    AND ucp.progress_seconds IS NOT NULL
    AND ucp.total_seconds IS NOT NULL
    AND ucp.progress_seconds >= 3
    AND ucp.progress_seconds <= (ucp.total_seconds - 3)
    AND (ucp.progress_seconds::numeric / NULLIF(ucp.total_seconds, 0)) >= 0.02
    AND (ucp.progress_seconds::numeric / NULLIF(ucp.total_seconds, 0)) <= 0.95
    AND dismissed.post_id IS NULL
    AND complete.post_id IS NULL
  ORDER BY ucp.last_interaction_at DESC
  LIMIT p_limit;
END;
$function$;