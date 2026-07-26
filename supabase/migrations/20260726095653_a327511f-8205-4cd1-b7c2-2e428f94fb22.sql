-- ============================================================================
-- One-off backfill: historical game notifications -> Activity (Crowns tab)
-- No push, no badge change, original timestamps, idempotent.
-- ============================================================================

-- Idempotency anchor: a real unique constraint on the natural key carried by
-- backfilled rows only. Live dual-write rows have no 'gam_backfill_key', so
-- they are outside this index and can never collide with it.
CREATE UNIQUE INDEX IF NOT EXISTS notifications_gam_backfill_key_uidx
  ON public.notifications ((data->>'gam_backfill_key'))
  WHERE data ? 'gam_backfill_key';

DO $backfill$
DECLARE
  -- MUST match v_game_types in get_activity_feed and GAME_NOTIF_TYPES in
  -- src/features/activity-v2/components/ledgerKinds.tsx.
  v_game_types text[] := ARRAY[
    'level_up','level_near',
    'legend_earned','legend_lost',
    'crown_taken','crown_lost',
    'streak_at_risk','streak_broken','streak_freeze_applied',
    'status_at_risk','status_reclaimed',
    'rival_played'
  ];
  v_tx_start   timestamptz := clock_timestamp();
  v_inserted   integer;
  v_pushes     integer;
BEGIN
  -- Session-scoped push suppression. SET LOCAL is transaction-scoped, so it
  -- unwinds automatically on COMMIT *or* ROLLBACK — no leak on error — and it
  -- never touches other connections, so concurrent real notifications still
  -- fire on_notification_auto_queue_push normally.
  SET LOCAL session_replication_role = replica;

  WITH src AS (
    SELECT
      o.user_id,
      o.notification_type AS type,
      o.created_at,
      COALESCE(o.template_payload, '{}'::jsonb) AS payload,
      o.deduplication_key
    FROM public.gam_notification_outbox o
    -- Delivered only: every 'sent' row carries sent_at; 'bundled' rows carry
    -- none (folded into a digest) and are therefore not "already seen".
    WHERE o.status = 'sent'
      AND o.sent_at IS NOT NULL
      AND o.deduplication_key IS NOT NULL
      AND o.notification_type = ANY(v_game_types)
  ), shaped AS (
    SELECT
      s.*,
      CASE s.type
        WHEN 'level_up'              THEN 'New tier reached'
        WHEN 'level_near'            THEN 'Almost there'
        WHEN 'legend_earned'         THEN 'Course legend'
        WHEN 'legend_lost'           THEN 'Crown lost'
        WHEN 'crown_taken'           THEN 'Crown taken'
        WHEN 'crown_lost'            THEN 'Crown lost'
        WHEN 'streak_at_risk'        THEN 'Streak at risk'
        WHEN 'streak_broken'         THEN 'Streak broken'
        WHEN 'streak_freeze_applied' THEN 'Streak saved'
        WHEN 'status_at_risk'        THEN 'Status at risk'
        WHEN 'status_reclaimed'      THEN 'Status reclaimed'
        WHEN 'rival_played'          THEN 'Rival on the course'
      END AS title,
      -- Mirrors activityCopy() in supabase/functions/gam-evaluator/index.ts.
      CASE s.type
        WHEN 'level_up'   THEN 'You reached ' || COALESCE(s.payload->>'label','a new tier') || '.'
        WHEN 'level_near' THEN 'You are ' || COALESCE(s.payload->>'gap','a few') || ' medals from ' || COALESCE(s.payload->>'label','the next tier') || '.'
        WHEN 'legend_earned' THEN 'You are now the legend at ' || COALESCE(s.payload->>'course_name','this course') || '.'
        WHEN 'legend_lost'   THEN COALESCE(s.payload->>'taker_name','Someone') || ' took your legend title at ' || COALESCE(s.payload->>'course_name','this course') || '.'
        WHEN 'crown_taken'   THEN 'You took the crown at ' || COALESCE(s.payload->>'course_name','this course') || '.'
        WHEN 'crown_lost'    THEN COALESCE(s.payload->>'new_holder_name','Someone') || ' took your crown at ' || COALESCE(s.payload->>'course_name','this course') || '.'
        WHEN 'streak_at_risk' THEN 'Your ' || COALESCE(s.payload->>'streak_type','playing') || ' streak is about to break.'
        WHEN 'streak_broken'  THEN 'Your ' || COALESCE(s.payload->>'streak_type','playing') || ' streak ended at ' || COALESCE(s.payload->>'count','0') || '.'
        WHEN 'streak_freeze_applied' THEN 'A freeze kept your ' || COALESCE(s.payload->>'streak_type','playing') || ' streak alive.'
        WHEN 'status_at_risk'   THEN 'Your handicap status is slipping below the hold line.'
        WHEN 'status_reclaimed' THEN 'You are back inside your handicap status band.'
        WHEN 'rival_played'     THEN COALESCE(s.payload->>'rival_name','Your rival') || ' posted a round at ' || COALESCE(s.payload->>'course_name','this course') || '.'
      END AS message,
      CASE WHEN s.type IN ('legend_earned','legend_lost','crown_taken','crown_lost','rival_played')
           THEN 'course' END AS entity_type,
      CASE WHEN s.type IN ('legend_earned','legend_lost','crown_taken','crown_lost','rival_played')
            AND s.payload->>'course_id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
           THEN (s.payload->>'course_id')::uuid END AS entity_id
    FROM src s
  )
  INSERT INTO public.notifications (
    user_id, recipient_actor_type, recipient_actor_id,
    type, title, message, data, entity_type, entity_id, actor_id,
    is_read, read, created_at, updated_at
  )
  SELECT
    sh.user_id, 'personal', sh.user_id,
    sh.type, sh.title, sh.message,
    sh.payload || jsonb_build_object('gam_backfill_key', sh.deduplication_key),
    sh.entity_type, sh.entity_id, NULL,
    -- STEP 4: read on arrival. These are historical events the user already
    -- saw as a push; unread would spike every bell with months-old rows.
    true, true,
    -- STEP 5: created_at/updated_at default to now(); we override both
    -- explicitly. No BEFORE INSERT trigger exists on notifications (the only
    -- trigger is the AFTER INSERT push queuer), so nothing rewrites them.
    sh.created_at, sh.created_at
  FROM shaped sh
  -- STEP 6b: never duplicate a dual-write row from 053b05c onwards. The dual
  -- write does not carry the dedup key, so it is matched on the natural
  -- (user_id, type, created_at) tuple with a 5-minute tolerance, because the
  -- Activity insert lands slightly after the outbox insert it mirrors.
  WHERE NOT EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.recipient_actor_id = sh.user_id
      AND n.recipient_actor_type = 'personal'
      AND n.type = sh.type
      AND NOT (n.data ? 'gam_backfill_key')
      AND n.created_at BETWEEN sh.created_at - interval '5 minutes'
                           AND sh.created_at + interval '5 minutes'
  )
  -- STEP 6a/7: idempotent on the real unique index. Second run inserts zero.
  ON CONFLICT ((data->>'gam_backfill_key')) WHERE data ? 'gam_backfill_key'
  DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- STEP 3 VERIFY: prove the suppression held before this commits.
  SELECT count(*) INTO v_pushes
  FROM public.push_notification_queue
  WHERE created_at >= v_tx_start;

  IF v_pushes > 0 THEN
    RAISE EXCEPTION
      'ABORT: backfill queued % push rows (expected 0). Rolling back; no rows inserted.',
      v_pushes;
  END IF;

  RAISE NOTICE 'Backfill inserted % activity rows, 0 pushes queued.', v_inserted;
END
$backfill$;