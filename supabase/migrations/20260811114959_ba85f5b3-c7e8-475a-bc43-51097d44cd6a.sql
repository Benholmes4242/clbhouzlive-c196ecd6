-- 1. Shared recount for round-backed posts: round reactions + business post_likes
CREATE OR REPLACE FUNCTION public.recount_round_post_likes(p_score_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
  UPDATE public.posts p
     SET like_count = (
           SELECT count(*) FROM public.content_reactions cr
            WHERE cr.target_type = 'round' AND cr.target_id = p_score_id
         ) + (
           SELECT count(*) FROM public.post_likes pl
            WHERE pl.post_id = p.id AND pl.actor_type = 'business'
         )
   WHERE p.whs_score_id = p_score_id;
$fn$;

CREATE OR REPLACE FUNCTION public.content_reactions_sync_post_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_target_type text := COALESCE(NEW.target_type, OLD.target_type);
  v_target_id uuid := COALESCE(NEW.target_id, OLD.target_id);
BEGIN
  IF v_target_type <> 'round' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  PERFORM public.recount_round_post_likes(v_target_id);
  RETURN COALESCE(NEW, OLD);
END;
$fn$;

-- Business likes on round posts still land in post_likes; keep the round total honest.
-- Stale-client PERSONAL rows are deliberately ignored here (content_reactions is canonical).
CREATE OR REPLACE FUNCTION public.post_likes_sync_round_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_post uuid := COALESCE(NEW.post_id, OLD.post_id);
  v_actor_type text := COALESCE(NEW.actor_type, OLD.actor_type);
  v_score uuid;
BEGIN
  IF COALESCE(v_actor_type, 'personal') <> 'business' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  SELECT whs_score_id INTO v_score FROM public.posts WHERE id = v_post;
  IF v_score IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  PERFORM public.recount_round_post_likes(v_score);
  RETURN COALESCE(NEW, OLD);
END;
$fn$;

DROP TRIGGER IF EXISTS trg_post_likes_sync_round_like_count ON public.post_likes;
CREATE TRIGGER trg_post_likes_sync_round_like_count
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.post_likes_sync_round_like_count();

-- 2. One proof-like definition (viewer-agnostic, actor-set based)
CREATE OR REPLACE FUNCTION public.post_proof_liked(
  p_post_id uuid,
  p_actor_ids uuid[],
  p_since timestamptz
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
  SELECT CASE
    WHEN p_post_id IS NULL OR p_actor_ids IS NULL OR array_length(p_actor_ids, 1) IS NULL THEN FALSE
    ELSE (
      EXISTS (
        SELECT 1 FROM public.post_likes plf
        WHERE plf.post_id = p_post_id
          AND plf.actor_type = 'personal'
          AND plf.actor_id = ANY (p_actor_ids)
          AND plf.created_at > p_since
      )
      OR EXISTS (
        SELECT 1
        FROM public.posts pp
        JOIN public.content_reactions crf
          ON crf.target_type = 'round'
         AND crf.target_id = pp.whs_score_id
        WHERE pp.id = p_post_id
          AND pp.whs_score_id IS NOT NULL
          AND crf.user_id = ANY (p_actor_ids)
          AND crf.created_at > p_since
      )
    )
  END
$fn$;

COMMENT ON FUNCTION public.post_proof_liked(uuid, uuid[], timestamptz) IS
  'Canonical social-proof like predicate: did any of these actors like this post recently? Covers post_likes and content_reactions (round-backed posts). Change here only.';

GRANT EXECUTE ON FUNCTION public.post_proof_liked(uuid, uuid[], timestamptz) TO anon, authenticated, service_role;

-- 3. Canonical write path
CREATE OR REPLACE FUNCTION public.toggle_post_like(
  p_post_id uuid,
  p_liked boolean,
  p_actor_type text DEFAULT 'personal',
  p_actor_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_uid uuid := auth.uid();
  v_actor_type text := COALESCE(p_actor_type, 'personal');
  v_actor_id uuid;
  v_score uuid;
  v_exists boolean;
  v_count integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'toggle_post_like: not authenticated';
  END IF;

  IF v_actor_type = 'business' THEN
    v_actor_id := p_actor_id;
    IF v_actor_id IS NULL OR NOT public.can_manage_business(v_actor_id) THEN
      RAISE EXCEPTION 'toggle_post_like: not permitted for this business actor';
    END IF;
  ELSE
    v_actor_id := COALESCE(p_actor_id, v_uid);
    IF v_actor_id <> v_uid THEN
      RAISE EXCEPTION 'toggle_post_like: actor mismatch';
    END IF;
  END IF;

  SELECT TRUE, whs_score_id INTO v_exists, v_score
  FROM public.posts WHERE id = p_post_id;

  IF NOT COALESCE(v_exists, FALSE) THEN
    RAISE EXCEPTION 'toggle_post_like: post not found';
  END IF;

  IF v_score IS NOT NULL AND v_actor_type = 'personal' THEN
    IF p_liked THEN
      INSERT INTO public.content_reactions (user_id, target_type, target_id)
      VALUES (v_uid, 'round', v_score)
      ON CONFLICT (user_id, target_type, target_id) DO NOTHING;
    ELSE
      DELETE FROM public.content_reactions
      WHERE user_id = v_uid AND target_type = 'round' AND target_id = v_score;
    END IF;
  ELSE
    IF p_liked THEN
      INSERT INTO public.post_likes (post_id, user_id, actor_id, actor_type)
      VALUES (p_post_id, v_uid, v_actor_id, v_actor_type)
      ON CONFLICT (post_id, actor_type, actor_id) DO NOTHING;
    ELSE
      DELETE FROM public.post_likes
      WHERE post_id = p_post_id AND actor_id = v_actor_id AND actor_type = v_actor_type;
    END IF;
  END IF;

  SELECT COALESCE(like_count, 0) INTO v_count FROM public.posts WHERE id = p_post_id;

  RETURN jsonb_build_object(
    'liked', public.viewer_liked_post(p_post_id, v_actor_id, v_actor_type),
    'like_count', v_count
  );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.toggle_post_like(uuid, boolean, text, uuid) TO authenticated, service_role;

-- 4. Read path: stored count + shared proof predicate
DO $do$
DECLARE
  r record;
  src text;
  nsrc text;
  patched int := 0;
  missed text[] := '{}';
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
        'get_watch_mixed_grid','get_watch_mixed_grid_v2',
        'get_watch_shorts','get_watch_shorts_v2',
        'get_suggested_feed_v3'
      )
  LOOP
    src := pg_get_functiondef(r.oid);
    nsrc := src;

    -- 4a. like_count from posts, not a row count
    nsrc := regexp_replace(
      nsrc,
      '\(SELECT COUNT\(\*\) AS cnt FROM post_likes (?:pl|lk) WHERE (?:pl|lk)\.post_id = ([A-Za-z_0-9\.]+)\)',
      '(SELECT COALESCE(plq.like_count, 0) AS cnt FROM posts plq WHERE plq.id = \1)',
      'g'
    );

    -- 4b. social proof through the shared helper
    IF r.proname = 'get_suggested_feed_v3' THEN
      nsrc := regexp_replace(
        nsrc,
        'EXISTS \(\s*SELECT 1 FROM post_likes plf\s+JOIN my_following mfx ON mfx\.following_id = plf\.actor_id\s+WHERE plf\.post_id = cr\.id\s+AND plf\.actor_type = ''personal''\s+AND plf\.created_at > now\(\) - make_interval\(hours => c_proof_hours::integer\)\s*\)',
        'public.post_proof_liked(cr.id, ARRAY(SELECT mfx.following_id FROM my_following mfx), now() - make_interval(hours => c_proof_hours::integer))',
        'g'
      );
    ELSIF r.proname = 'get_watch_shorts_v2' THEN
      nsrc := regexp_replace(
        nsrc,
        'EXISTS \(\s*SELECT 1 FROM post_likes plf\s+JOIN my_follows mfp ON mfp\.uid = plf\.actor_id\s+WHERE plf\.post_id = c\.p_id AND plf\.actor_type = ''personal''\s+AND plf\.created_at > NOW\(\) - make_interval\(hours => c_fy_proof_hours::integer\)\s*\)',
        'public.post_proof_liked(c.p_id, ARRAY(SELECT mfp.uid FROM my_follows mfp), NOW() - make_interval(hours => c_fy_proof_hours::integer))',
        'g'
      );
    END IF;

    IF nsrc = src THEN
      missed := missed || (r.proname || '(' || r.args || ')');
      CONTINUE;
    END IF;

    IF nsrc ~ 'COUNT\(\*\) AS cnt FROM post_likes' OR nsrc ~ 'post_likes plf' THEN
      RAISE EXCEPTION 'step3 rewrite incomplete for %(%)', r.proname, r.args;
    END IF;

    EXECUTE nsrc;
    patched := patched + 1;
  END LOOP;

  IF array_length(missed, 1) > 0 THEN
    RAISE EXCEPTION 'step3: no pattern matched in %', array_to_string(missed, ', ');
  END IF;

  IF patched <> 10 THEN
    RAISE EXCEPTION 'step3: expected 10 patched functions, got %', patched;
  END IF;
END
$do$;

-- 5. Bring existing round posts onto the new count formula
DO $do$
DECLARE s uuid;
BEGIN
  FOR s IN SELECT DISTINCT whs_score_id FROM public.posts WHERE whs_score_id IS NOT NULL LOOP
    PERFORM public.recount_round_post_likes(s);
  END LOOP;
END
$do$;