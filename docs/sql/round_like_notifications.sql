-- ============================================================================
-- ROUND LIKES NOTIFY LIKE POST LIKES (type 'like', aggregated).
-- Ben runs this as postgres. NOT APPLIED BY THE AGENT.
--
-- FUNCTION TOUCHED: public.tg_notify_content_reaction()
--   deployed md5 asserted: 86157d2daff9efd993b85635b32f42b1
-- FUNCTIONS READ, SIGNATURES ASSERTED, BODIES UNCHANGED:
--   public.reaction_target_owner(text,uuid)  md5 6218b20d0d2824be5aff6c3ff85bd8a6
--   public.are_users_blocked(uuid,uuid)
-- MODEL COPIED VERBATIM (behaviour, not text):
--   public.create_like_notification_aggregated()  md5 5b817cc24d37692ecb30b1451a737935
--   6 hour window, unread-only, one row per (recipient, entity), like_count,
--   recent_liker_ids / recent_liker_names capped at 5, are_users_blocked guard,
--   NO notification_preferences check (it does none), self-like skipped,
--   unique_violation swallowed.
--
-- STANDING RULES (docs/sql/README.md): no backslash meta-commands; the deployed
-- md5 of every rebuilt function asserted; a rerun refusal; a full-body rebuild
-- guarded by md5; every column proven from information_schema; read back after
-- EXECUTE; and the rebuilt function is CALLED FOR REAL inside the same
-- transaction (here: a real INSERT under a SAVEPOINT, rolled back).
--
-- COLUMNS ASSERTED BELOW:
--   content_reactions: target_type, target_id, user_id, created_at
--   posts: id, whs_score_id
--   notifications: user_id, recipient_actor_id, recipient_actor_type, actor_id,
--                  type, title, message, entity_type, entity_id, data,
--                  is_read, read, created_at, updated_at
--   user_profiles: id, display_name, username, profile_photo_url
--   whs_scores: id, connection_id, course_id
--   whs_connections: id, user_id
--   whs_to_golf_course_map: whs_course_id, golf_course_id
--   course_ratings: id, user_id, course_id, review
--
-- ============================================================================
-- CONTRADICTIONS WITH THE BRIEF (the brief wins; recorded, not hidden)
--
-- 1. "the player is never told" IS NOT TRUE. A round like already notifies -
--    just under type 'reaction', not 'like'. Live, last 30 days:
--      type 'like'     entity_type 'post'  : 94 rows, newest 2026-09-15 14:02
--      type 'reaction' entity_type 'round' : 85 rows, newest 2026-09-13 18:41
--    So the fault is not silence, it is the WRONG SHAPE: type 'reaction' with
--    data { actor_id, target_type, target_id, course_id, score_id }, which
--    activityLinks.ts routes to /handicap?score=... (its `reaction` branch),
--    never to /round/:id; and it never aggregates - the deployed body inserts
--    at most ONE row per (owner, actor, target) forever and RETURNs on the
--    second like from the same person, with no like_count.
--    The brief's remedy still stands, so this patch converts the round branch
--    to the aggregated 'like' shape.
--
-- 2. Because of (1), this patch REMOVES the 'reaction' notification for rounds.
--    Keeping both would tell the owner twice for one like. Reviews and ratings
--    keep the 'reaction' path byte-for-byte.
--
-- 3. DELETE (unlike): the post-like path does NOTHING to notifications on
--    delete (trg_posts_like_delete only calls posts_decrement_like_count).
--    Mirroring it therefore means no notification change on unlike, and the
--    trigger stays AFTER INSERT only. No new trigger is created.
--
-- 4. entity shape when a round has NO post: entity_type 'round',
--    entity_id = whs_score_id. activityLinks.ts does NOT branch on
--    entity_type 'round' - but it does not need to: its ROUND_REACTION_TYPES
--    branch (which includes 'like') keys on data.whs_score_id + is_round, both
--    of which this patch ALWAYS writes, and it resolves ahead of every /post/
--    branch. So both shapes open /round/:id with no /post step.
--
-- 5. No backfill of the 85 existing 'reaction' rows, as instructed.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------- guard block
DO $guard$
DECLARE
  v_md5      text;
  v_body     text;
  v_missing  text := '';
  r          record;
BEGIN
  -- 1. columns, proven not recalled
  FOR r IN
    SELECT * FROM (VALUES
      ('content_reactions','target_type'),('content_reactions','target_id'),
      ('content_reactions','user_id'),('content_reactions','created_at'),
      ('posts','id'),('posts','whs_score_id'),
      ('notifications','user_id'),('notifications','recipient_actor_id'),
      ('notifications','recipient_actor_type'),('notifications','actor_id'),
      ('notifications','type'),('notifications','title'),
      ('notifications','message'),('notifications','entity_type'),
      ('notifications','entity_id'),('notifications','data'),
      ('notifications','is_read'),('notifications','read'),
      ('notifications','created_at'),('notifications','updated_at'),
      ('user_profiles','id'),('user_profiles','display_name'),
      ('user_profiles','username'),('user_profiles','profile_photo_url'),
      ('whs_scores','id'),('whs_scores','connection_id'),('whs_scores','course_id'),
      ('whs_connections','id'),('whs_connections','user_id'),
      ('whs_to_golf_course_map','whs_course_id'),
      ('whs_to_golf_course_map','golf_course_id'),
      ('course_ratings','id'),('course_ratings','user_id'),
      ('course_ratings','course_id'),('course_ratings','review')
    ) AS t(tbl, col)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = r.tbl AND column_name = r.col
    ) THEN
      v_missing := v_missing || format(' %s.%s', r.tbl, r.col);
    END IF;
  END LOOP;
  IF v_missing <> '' THEN
    RAISE EXCEPTION 'MISSING COLUMN(S):%', v_missing;
  END IF;

  -- 2. function signatures
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'reaction_target_owner'
      AND pg_get_function_identity_arguments(p.oid) = 'p_target_type text, p_target_id uuid'
  ) THEN
    RAISE EXCEPTION 'MISSING public.reaction_target_owner(text, uuid)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'are_users_blocked'
  ) THEN
    RAISE EXCEPTION 'MISSING public.are_users_blocked';
  END IF;

  -- 3. the exact deployed body we are replacing
  SELECT pg_get_functiondef(p.oid) INTO v_body
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'tg_notify_content_reaction';

  IF v_body IS NULL THEN
    RAISE EXCEPTION 'public.tg_notify_content_reaction does not exist';
  END IF;

  -- 4. RERUN REFUSAL, checked before the md5 so a second run says why
  IF position('v_round_like_notify' IN v_body) > 0 THEN
    RAISE EXCEPTION 'ALREADY APPLIED: deployed body carries fingerprint v_round_like_notify. Refusing to run twice.';
  END IF;

  v_md5 := md5(v_body);
  IF v_md5 <> '86157d2daff9efd993b85635b32f42b1' THEN
    RAISE EXCEPTION 'tg_notify_content_reaction md5 is % - expected 86157d2daff9efd993b85635b32f42b1. Someone else patched it; stop and re-read.', v_md5;
  END IF;

  -- 5. the model function must be the one whose behaviour we copied
  SELECT md5(pg_get_functiondef(p.oid)) INTO v_md5
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'create_like_notification_aggregated';
  IF v_md5 IS DISTINCT FROM '5b817cc24d37692ecb30b1451a737935' THEN
    RAISE EXCEPTION 'create_like_notification_aggregated md5 is % - expected 5b817cc24d37692ecb30b1451a737935. The aggregation this patch mirrors has changed.', v_md5;
  END IF;

  SELECT md5(pg_get_functiondef(p.oid)) INTO v_md5
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'reaction_target_owner';
  IF v_md5 IS DISTINCT FROM '6218b20d0d2824be5aff6c3ff85bd8a6' THEN
    RAISE EXCEPTION 'reaction_target_owner md5 is % - expected 6218b20d0d2824be5aff6c3ff85bd8a6.', v_md5;
  END IF;

  RAISE NOTICE 'GUARDS PASSED: 35 columns, 2 signatures, 3 md5s, rerun refusal clear.';
END
$guard$;

-- ------------------------------------------------------- full-body rebuild
CREATE OR REPLACE FUNCTION public.tg_notify_content_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  -- FINGERPRINT v_round_like_notify - the rerun refusal above looks for this.
  v_round_like_notify boolean := true;

  AGGREGATION_WINDOW  INTERVAL := INTERVAL '6 hours';

  v_owner       uuid;
  v_actor       text;
  v_avatar      text;
  v_exists      boolean;
  v_course_id   uuid;
  v_has_prose   boolean := false;
  v_title       text;

  v_post_id     uuid;
  v_entity_type text;
  v_entity_id   uuid;
  v_round       jsonb;

  v_notif_id    uuid;
  v_data        jsonb;
  v_count       int;
  v_names       jsonb;
  v_new_names   jsonb;
  v_new_count   int;
  v_message     text;
BEGIN
  v_owner := public.reaction_target_owner(NEW.target_type, NEW.target_id);

  -- No owner, or the owner liking their own thing: nothing to tell anyone.
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(up.display_name, up.username, 'Someone'), up.profile_photo_url
    INTO v_actor, v_avatar
  FROM user_profiles up WHERE up.id = NEW.user_id;

  IF v_actor IS NULL THEN v_actor := 'Someone'; END IF;

  -- ======================================================================
  -- ROUNDS: type 'like', aggregated exactly like post likes.
  -- ======================================================================
  IF NEW.target_type = 'round' THEN
    IF public.are_users_blocked(NEW.user_id, v_owner) THEN
      RETURN NEW;
    END IF;

    SELECT p.id INTO v_post_id
    FROM posts p WHERE p.whs_score_id = NEW.target_id
    ORDER BY p.created_at ASC LIMIT 1;

    -- A round WITH a post keeps today's post-like shape, so existing grouping
    -- and the likes sheet keep working. Without one, the round is the entity.
    IF v_post_id IS NOT NULL THEN
      v_entity_type := 'post';
      v_entity_id   := v_post_id;
    ELSE
      v_entity_type := 'round';
      v_entity_id   := NEW.target_id;
    END IF;

    -- ALWAYS carried, both shapes: activityLinks.ts routes on these keys.
    v_round := jsonb_strip_nulls(jsonb_build_object(
      'post_id',      v_post_id,
      'post_type',    'round',
      'whs_score_id', NEW.target_id,
      'is_round',     true
    ));

    SELECT n.id, n.data INTO v_notif_id, v_data
    FROM notifications n
    WHERE n.recipient_actor_id   = v_owner
      AND n.recipient_actor_type = 'personal'
      AND n.type = 'like'
      AND n.entity_type = v_entity_type
      AND n.entity_id   = v_entity_id
      AND n.is_read = false
      AND n.created_at > NOW() - AGGREGATION_WINDOW
    ORDER BY n.created_at DESC LIMIT 1;

    IF v_notif_id IS NOT NULL THEN
      v_count := COALESCE((v_data->>'like_count')::int, 1);
      v_names := COALESCE(v_data->'recent_liker_names', '[]'::jsonb);

      IF NOT (COALESCE(v_data->'recent_liker_ids', '[]'::jsonb) ? NEW.user_id::text) THEN
        v_new_count := v_count + 1;
        v_new_names := v_names || to_jsonb(v_actor);
        IF jsonb_array_length(v_new_names) > 5 THEN
          v_new_names := jsonb_path_query_array(v_new_names, '$[1 to 5]');
        END IF;

        IF v_new_count = 1 THEN
          v_message := (v_new_names->>0) || ' liked your round';
        ELSIF v_new_count = 2 THEN
          v_message := (v_new_names->>0) || ' and 1 other liked your round';
        ELSE
          v_message := (v_new_names->>0) || ' and ' || (v_new_count - 1) || ' others liked your round';
        END IF;

        BEGIN
          UPDATE notifications
             SET data = jsonb_build_object(
                   'like_count', v_new_count,
                   'recent_liker_ids',
                     COALESCE(v_data->'recent_liker_ids', '[]'::jsonb) || to_jsonb(NEW.user_id::text),
                   'recent_liker_names', v_new_names,
                   'actor_type', 'personal',
                   'actor_id',   NEW.user_id,
                   'actor_name', v_actor,
                   'actor_avatar_url', v_avatar
                 ) || v_round,
                 title      = 'New like',
                 message    = v_message,
                 actor_id   = NEW.user_id,
                 updated_at = NOW()
           WHERE id = v_notif_id;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
      END IF;
    ELSE
      BEGIN
        INSERT INTO notifications (
          user_id, recipient_actor_id, recipient_actor_type, actor_id,
          type, title, message, entity_type, entity_id, data, is_read, read
        ) VALUES (
          v_owner, v_owner, 'personal', NEW.user_id,
          'like', 'New like', v_actor || ' liked your round',
          v_entity_type, v_entity_id,
          jsonb_build_object(
            'like_count', 1,
            'recent_liker_ids',   jsonb_build_array(NEW.user_id::text),
            'recent_liker_names', jsonb_build_array(v_actor),
            'actor_type', 'personal',
            'actor_id',   NEW.user_id,
            'actor_name', v_actor,
            'actor_avatar_url', v_avatar
          ) || v_round,
          false, false
        );
      EXCEPTION WHEN unique_violation THEN NULL;
      END;
    END IF;

    RETURN NEW;
  END IF;

  -- ======================================================================
  -- REVIEWS AND RATINGS: unchanged 'reaction' path (one row per actor+target).
  -- ======================================================================
  SELECT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = v_owner
      AND n.type = 'reaction'
      AND n.data->>'actor_id'    = NEW.user_id::text
      AND n.data->>'target_id'   = NEW.target_id::text
      AND n.data->>'target_type' = NEW.target_type
  ) INTO v_exists;

  IF v_exists THEN
    RETURN NEW;
  END IF;

  IF NEW.target_type = 'review' THEN
    SELECT r.course_id, COALESCE(btrim(r.review), '') <> ''
      INTO v_course_id, v_has_prose
    FROM course_ratings r WHERE r.id = NEW.target_id;
  ELSE
    SELECT g.id INTO v_course_id
    FROM whs_scores s
    LEFT JOIN whs_to_golf_course_map m ON m.whs_course_id = s.course_id
    LEFT JOIN golf_courses g ON g.id = m.golf_course_id
    WHERE s.id = NEW.target_id;
  END IF;

  v_title := CASE
    WHEN v_has_prose THEN v_actor || ' liked your review'
    ELSE                  v_actor || ' liked your rating'
  END;

  INSERT INTO notifications (
    user_id, type, title, message, data,
    read, is_read, actor_id, recipient_actor_id, entity_type
  ) VALUES (
    v_owner, 'reaction', v_title, NULL,
    jsonb_strip_nulls(jsonb_build_object(
      'actor_id',    NEW.user_id,
      'target_type', NEW.target_type,
      'target_id',   NEW.target_id,
      'course_id',   v_course_id
    )),
    false, false, NEW.user_id, v_owner, NEW.target_type
  );

  RETURN NEW;
END;
$function$;

-- ----------------------------------------------------------------- read back
DO $readback$
DECLARE
  v_body text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_body
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'tg_notify_content_reaction';

  IF position('v_round_like_notify' IN v_body) = 0 THEN
    RAISE EXCEPTION 'READ BACK FAILED: fingerprint absent from installed body.';
  END IF;
  IF position('liked your round' IN v_body) = 0 THEN
    RAISE EXCEPTION 'READ BACK FAILED: round wording absent.';
  END IF;
  RAISE NOTICE 'READ BACK OK. new md5 = %', md5(v_body);
END
$readback$;

-- ======================================================================
-- PROVE IT RUNS. A GUARD IS NOT A TEST - this inserts real rows through the
-- rebuilt trigger and then throws them away. Any failure aborts everything.
-- ======================================================================
SAVEPOINT round_like_test;

DO $selftest$
DECLARE
  v_score   uuid;
  v_owner   uuid;
  v_liker1  uuid;
  v_liker2  uuid;
  v_n       int;
  v_id      uuid;
  v_count   int;
BEGIN
  -- A real round whose owner is resolvable, with no existing like notification
  -- and no existing reactions from our two test likers.
  SELECT s.id, c.user_id INTO v_score, v_owner
  FROM whs_scores s
  JOIN whs_connections c ON c.id = s.connection_id
  WHERE c.user_id IS NOT NULL
  ORDER BY s.created_at DESC NULLS LAST
  LIMIT 1;

  IF v_score IS NULL THEN
    RAISE EXCEPTION 'SELF TEST: no round with a resolvable owner found.';
  END IF;

  SELECT id INTO v_liker1 FROM user_profiles
   WHERE id <> v_owner
     AND NOT EXISTS (SELECT 1 FROM content_reactions cr
                      WHERE cr.target_type='round' AND cr.target_id=v_score AND cr.user_id=user_profiles.id)
   ORDER BY created_at LIMIT 1;

  SELECT id INTO v_liker2 FROM user_profiles
   WHERE id <> v_owner AND id <> v_liker1
     AND NOT EXISTS (SELECT 1 FROM content_reactions cr
                      WHERE cr.target_type='round' AND cr.target_id=v_score AND cr.user_id=user_profiles.id)
   ORDER BY created_at LIMIT 1;

  IF v_liker1 IS NULL OR v_liker2 IS NULL THEN
    RAISE EXCEPTION 'SELF TEST: could not find two non-owner likers.';
  END IF;

  RAISE NOTICE 'SELF TEST round=% owner=% liker1=% liker2=%', v_score, v_owner, v_liker1, v_liker2;

  -- first like
  INSERT INTO content_reactions (target_type, target_id, user_id)
  VALUES ('round', v_score, v_liker1);

  SELECT count(*), min(id) INTO v_n, v_id
  FROM notifications
  WHERE user_id = v_owner AND type = 'like'
    AND data->>'whs_score_id' = v_score::text
    AND data->>'is_round' = 'true'
    AND created_at > NOW() - INTERVAL '1 minute';

  IF v_n <> 1 THEN
    RAISE EXCEPTION 'SELF TEST FAILED: expected exactly 1 round like notification, got %', v_n;
  END IF;
  RAISE NOTICE 'SELF TEST: one notification created, id=%', v_id;

  -- second like, different person, same round
  INSERT INTO content_reactions (target_type, target_id, user_id)
  VALUES ('round', v_score, v_liker2);

  SELECT count(*) INTO v_n
  FROM notifications
  WHERE user_id = v_owner AND type = 'like'
    AND data->>'whs_score_id' = v_score::text
    AND created_at > NOW() - INTERVAL '1 minute';

  IF v_n <> 1 THEN
    RAISE EXCEPTION 'SELF TEST FAILED: second like created a new row (% rows) instead of aggregating', v_n;
  END IF;

  SELECT (data->>'like_count')::int INTO v_count FROM notifications WHERE id = v_id;
  IF v_count <> 2 THEN
    RAISE EXCEPTION 'SELF TEST FAILED: like_count is %, expected 2', v_count;
  END IF;

  RAISE NOTICE 'SELF TEST PASSED: same row updated, like_count=2, message=%',
    (SELECT message FROM notifications WHERE id = v_id);
END
$selftest$;

ROLLBACK TO SAVEPOINT round_like_test;

COMMIT;
