-- 1. The one definition -------------------------------------------------
CREATE OR REPLACE FUNCTION public.viewer_liked_post(
  p_post_id uuid,
  p_viewer uuid,
  p_actor_type text DEFAULT 'personal'
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
  SELECT CASE
    WHEN p_post_id IS NULL OR p_viewer IS NULL THEN FALSE
    ELSE (
      EXISTS (
        SELECT 1 FROM public.post_likes pl
        WHERE pl.post_id = p_post_id
          AND pl.actor_type = COALESCE(p_actor_type, 'personal')
          AND pl.actor_id = p_viewer
      )
      OR (
        COALESCE(p_actor_type, 'personal') = 'personal'
        AND EXISTS (
          SELECT 1
          FROM public.posts p
          JOIN public.content_reactions cr
            ON cr.target_type = 'round'
           AND cr.target_id = p.whs_score_id
          WHERE p.id = p_post_id
            AND p.whs_score_id IS NOT NULL
            AND cr.user_id = p_viewer
        )
      )
    )
  END
$fn$;

COMMENT ON FUNCTION public.viewer_liked_post(uuid, uuid, text) IS
  'Canonical viewer-liked predicate. Reads post_likes plus content_reactions (target_type=round) for round-backed posts. All liked flags in every RPC and client read must route through this. Change here only.';

GRANT EXECUTE ON FUNCTION public.viewer_liked_post(uuid, uuid, text) TO anon, authenticated, service_role;

-- 2. Route all 13 through it --------------------------------------------
DO $do$
DECLARE
  r record;
  src text;
  nsrc text;
  pid_expr text;
  patched int := 0;
  untouched text[] := '{}';
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND p.proname IN (
        'get_course_media','get_course_media_v2',
        'get_explore_feed','get_explore_feed_v2',
        'get_long_form_videos','get_long_form_videos_v2',
        'get_suggested_feed','get_suggested_feed_v3',
        'get_watch_mixed_grid','get_watch_mixed_grid_v2',
        'get_watch_shorts','get_watch_shorts_v2'
      )
  LOOP
    src := pg_get_functiondef(r.oid);
    nsrc := src;

    -- Shape A: inline EXISTS(...) actor-typed subquery
    nsrc := regexp_replace(
      nsrc,
      'EXISTS\s*\(\s*SELECT 1 FROM (?:public\.)?post_likes pl\s+WHERE pl\.post_id = ([A-Za-z_0-9\.]+)\s+AND pl\.actor_type = v_viewer_actor_type\s+AND pl\.actor_id = v_viewer_actor_id\s*\)',
      'public.viewer_liked_post(\1, v_viewer_actor_id, v_viewer_actor_type)',
      'g'
    );

    -- Shape B: LEFT JOIN post_likes ml sentinel. Post-id expression differs
    -- per family, so read it off that function's own join clause.
    IF nsrc ~ 'LEFT JOIN post_likes ml ON ml\.post_id = ' THEN
      pid_expr := (regexp_match(nsrc, 'LEFT JOIN post_likes ml ON ml\.post_id = ([A-Za-z_0-9\.]+)'))[1];

      nsrc := regexp_replace(
        nsrc,
        'CASE WHEN ml\.actor_id IS NOT NULL THEN TRUE ELSE FALSE END(\s+AS\s+[a-z_]*liked_by_me)',
        'public.viewer_liked_post(' || pid_expr || ', v_viewer_actor_id, v_viewer_actor_type)\1',
        'g'
      );

      -- legacy pre-actor overload (get_explore_feed old signature)
      nsrc := regexp_replace(
        nsrc,
        'CASE WHEN ml\.user_id IS NOT NULL THEN TRUE ELSE FALSE END(\s+AS\s+[a-z_]*liked_by_me)',
        'public.viewer_liked_post(' || pid_expr || ', v_user_id, ''personal'')\1',
        'g'
      );
    END IF;

    IF nsrc = src THEN
      untouched := untouched || (r.proname || '(' || r.args || ')');
      CONTINUE;
    END IF;

    -- No viewer-scoped post_likes predicate may survive the rewrite.
    IF nsrc ~ 'pl\.actor_id = v_viewer_actor_id'
       OR nsrc ~ 'ml\.actor_id IS NOT NULL'
       OR nsrc ~ 'ml\.user_id IS NOT NULL' THEN
      RAISE EXCEPTION 'viewer_liked_post rewrite incomplete for %(%)', r.proname, r.args;
    END IF;

    EXECUTE nsrc;
    patched := patched + 1;
  END LOOP;

  IF array_length(untouched, 1) > 0 THEN
    RAISE EXCEPTION 'viewer_liked_post: no liked-flag pattern matched in %', array_to_string(untouched, ', ');
  END IF;

  IF patched <> 13 THEN
    RAISE EXCEPTION 'viewer_liked_post: expected 13 patched functions, got %', patched;
  END IF;

  RAISE NOTICE 'viewer_liked_post: patched % functions', patched;
END
$do$;