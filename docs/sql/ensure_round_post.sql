-- ensure_round_post(p_whs_score_id uuid) RETURNS uuid
-- FIX_EVERY_ROUND_IS_COMMENTABLE §2. Hand-run by Ben. Nothing here is applied by the agent.
--
-- CLUBHOUSE EXCLUSION (verified against the live get_suggested_feed_v3, 27 Sep 2026):
--   * non-round branch: `WHERE b.post_type IS DISTINCT FROM 'round'`
--   * round branch:     `WHERE rp.round_recency_rank <= GREATEST(c_round_pool_cap::integer, 0)`
--                        with feed_config round_pool_cap = 0  -> no rounds admitted.
--   The media-backed feeds exclude it structurally (no post_media row is written).
--   So the new row uses post_type = 'round' and no media: the SAME exclusion, no new flag.
--   NOTE: the exclusion is config (round_pool_cap = 0), not code. Raising it would
--   surface these rows along with the 726 existing ones.
--
-- FOLLOWER NOTIFICATIONS: trg_new_post_notifications fires AFTER INSERT WHEN
--   status = 'published', and create_new_post_notifications handles round posts
--   (v_is_round), i.e. a first comment would tell the OWNER'S followers that the
--   owner "posted" a round. To avoid that, the row is inserted as 'draft' and then
--   updated to 'published' (the trigger is INSERT-only). Verify no UPDATE trigger
--   on posts.status notifies before running (query at foot).
--
-- ONE POST PER ROUND: a transaction-scoped advisory lock on the score id serialises
--   concurrent first comments; the second caller finds the first's row.
--   Stronger (recommended, separate decision): a partial unique index
--   posts(whs_score_id) WHERE whs_score_id IS NOT NULL.
--
-- VISIBILITY: the caller must be the owner or pass can_view_handicap(caller, owner),
--   the gate get_profile_rounds uses. Visibility / created_at copy backfill_round_posts.
--
-- Columns checked in the guard: posts.{user_id,content,course_id,whs_score_id,post_type,
--   actor_type,actor_id,visibility,status,round_notability,created_at};
--   gam_round_stats.{whs_score_id,user_id,course_id,play_date,eagles,albatrosses,
--   holes_in_one,clean_card,beat_par,longest_birdie_run}; can_view_handicap(uuid,uuid).

BEGIN;

DO $$
DECLARE c text; missing text[] := '{}';
BEGIN
  FOREACH c IN ARRAY ARRAY['posts.user_id','posts.content','posts.course_id','posts.whs_score_id',
    'posts.post_type','posts.actor_type','posts.actor_id','posts.visibility','posts.status',
    'posts.round_notability','posts.created_at','gam_round_stats.whs_score_id','gam_round_stats.user_id',
    'gam_round_stats.course_id','gam_round_stats.play_date','gam_round_stats.eagles',
    'gam_round_stats.albatrosses','gam_round_stats.holes_in_one','gam_round_stats.clean_card',
    'gam_round_stats.beat_par','gam_round_stats.longest_birdie_run'] LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public'
       AND table_name=split_part(c,'.',1) AND column_name=split_part(c,'.',2)) THEN
      missing := missing || c;
    END IF;
  END LOOP;
  IF array_length(missing,1) > 0 THEN RAISE EXCEPTION 'missing columns: %', missing; END IF;
  IF to_regprocedure('public.can_view_handicap(uuid,uuid)') IS NULL THEN
    RAISE EXCEPTION 'missing function can_view_handicap(uuid,uuid)'; END IF;
  IF to_regprocedure('public.ensure_round_post(uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'ensure_round_post already exists; refusing to run twice'; END IF;
END $$;

CREATE FUNCTION public.ensure_round_post(p_whs_score_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  v_caller uuid := auth.uid();
  v_rs     record;
  v_post   uuid;
  v_notab  smallint;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;

  SELECT whs_score_id, user_id, course_id, play_date, eagles, albatrosses, holes_in_one,
         clean_card, beat_par, longest_birdie_run
    INTO v_rs FROM public.gam_round_stats WHERE whs_score_id = p_whs_score_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'round not found' USING ERRCODE = 'P0002'; END IF;

  IF v_rs.user_id <> v_caller AND NOT public.can_view_handicap(v_caller, v_rs.user_id) THEN
    RAISE EXCEPTION 'round not visible' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_whs_score_id::text, 0));

  SELECT id INTO v_post FROM public.posts WHERE whs_score_id = p_whs_score_id LIMIT 1;
  IF v_post IS NOT NULL THEN RETURN v_post; END IF;

  v_notab := CASE
    WHEN COALESCE(v_rs.holes_in_one,0) > 0 OR COALESCE(v_rs.albatrosses,0) > 0 THEN 4
    WHEN COALESCE(v_rs.eagles,0) > 0 THEN 3
    WHEN v_rs.clean_card OR v_rs.beat_par THEN 2
    WHEN COALESCE(v_rs.longest_birdie_run,0) >= 3 THEN 1
    ELSE 0 END;

  INSERT INTO public.posts (user_id, content, course_id, whs_score_id, post_type,
      actor_type, actor_id, visibility, status, round_notability, created_at)
  VALUES (v_rs.user_id, NULL, v_rs.course_id, p_whs_score_id, 'round',
      'personal', v_rs.user_id,
      CASE WHEN v_notab >= 2 THEN 'anyone'::post_visibility ELSE 'followers'::post_visibility END,
      'draft', v_notab,
      COALESCE((v_rs.play_date::timestamp + interval '18 hours') AT TIME ZONE 'UTC', now()))
  RETURNING id INTO v_post;

  UPDATE public.posts SET status = 'published' WHERE id = v_post;
  RETURN v_post;
END;
$fn$;

REVOKE ALL ON FUNCTION public.ensure_round_post(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_round_post(uuid) TO authenticated;

-- STANDING RULE: call it before COMMIT. Replace <owner> with a member who has a
-- post-less round; the whole transaction rolls back at the end of the self-test
-- block unless you swap ROLLBACK for COMMIT after reading the output.
--   SELECT set_config('request.jwt.claims', json_build_object('sub','<owner>','role','authenticated')::text, true);
--   SELECT public.ensure_round_post('<post-less score id>') AS a,
--          public.ensure_round_post('<same score id>')      AS b;   -- a = b
--   SELECT count(*), count(DISTINCT whs_score_id) FROM posts WHERE whs_score_id IS NOT NULL; -- equal
--   SELECT count(*) FROM notifications WHERE created_at > now() - interval '1 minute';        -- 0 new

ROLLBACK;  -- change to COMMIT once the self-test reads correctly

-- Pre-check (run first): any UPDATE trigger on posts that could notify?
--   SELECT tgname, pg_get_triggerdef(oid) FROM pg_trigger
--    WHERE tgrelid = 'public.posts'::regclass AND NOT tgisinternal
--      AND pg_get_triggerdef(oid) ILIKE '%UPDATE%';
