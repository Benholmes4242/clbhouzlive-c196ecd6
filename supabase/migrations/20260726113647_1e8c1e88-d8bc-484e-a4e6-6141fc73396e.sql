-- ============================================================================
-- One-off backfill: historical badge_earned notifications -> Activity (Crowns)
-- No push, no badge change, original timestamps, idempotent.
-- Same proven pattern as 20260726095653; that migration's type list is
-- hardcoded and does not include badge_earned, hence a separate migration.
-- ============================================================================

DO $backfill$
DECLARE
  v_tx_start   timestamptz := clock_timestamp();
  v_inserted   integer;
  v_pushes     integer;
  v_fallback   integer;
BEGIN
  -- Transaction-scoped push suppression: unwinds on COMMIT or ROLLBACK and
  -- never touches other connections.
  SET LOCAL session_replication_role = replica;

  SELECT count(*) INTO v_fallback
  FROM public.gam_notification_outbox o
  LEFT JOIN public.gam_badge_catalogue b ON b.id = o.template_payload->>'badge_id'
  WHERE o.status = 'sent'
    AND o.sent_at IS NOT NULL
    AND o.deduplication_key IS NOT NULL
    AND o.notification_type = 'badge_earned'
    AND b.title IS NULL;

  WITH src AS (
    SELECT
      o.user_id,
      o.created_at,
      COALESCE(o.template_payload, '{}'::jsonb) AS payload,
      o.deduplication_key,
      b.title AS badge_title
    FROM public.gam_notification_outbox o
    LEFT JOIN public.gam_badge_catalogue b ON b.id = o.template_payload->>'badge_id'
    WHERE o.status = 'sent'
      AND o.sent_at IS NOT NULL
      AND o.deduplication_key IS NOT NULL
      AND o.notification_type = 'badge_earned'
  ), shaped AS (
    SELECT
      s.*,
      -- Mirrors activityCopy() in supabase/functions/gam-evaluator/index.ts:
      -- the title is rendered as a bold accent from data.badge_title, so the
      -- message stops before it. No catalogue match -> generic copy, no bold.
      CASE
        WHEN s.badge_title IS NULL THEN 'You earned a new badge.'
        WHEN s.payload->>'tier' IS NOT NULL THEN 'You reached tier ' || (s.payload->>'tier') || ' of'
        ELSE 'You earned'
      END AS message
    FROM src s
  )
  INSERT INTO public.notifications (
    user_id, recipient_actor_type, recipient_actor_id,
    type, title, message, data, entity_type, entity_id, actor_id,
    is_read, read, created_at, updated_at
  )
  SELECT
    sh.user_id, 'personal', sh.user_id,
    'badge_earned', 'Badge earned', sh.message,
    sh.payload
      || jsonb_build_object('gam_backfill_key', sh.deduplication_key)
      || CASE WHEN sh.badge_title IS NULL THEN '{}'::jsonb
              ELSE jsonb_build_object('badge_title', sh.badge_title) END,
    NULL, NULL, NULL,
    -- Historical events the user already saw as a push: read on arrival, so
    -- no unread count changes.
    true, true,
    sh.created_at, sh.created_at
  FROM shaped sh
  -- Never duplicate a live dual-write row (those carry no gam_backfill_key).
  WHERE NOT EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.recipient_actor_id = sh.user_id
      AND n.recipient_actor_type = 'personal'
      AND n.type = 'badge_earned'
      AND NOT (n.data ? 'gam_backfill_key')
      AND n.created_at BETWEEN sh.created_at - interval '5 minutes'
                           AND sh.created_at + interval '5 minutes'
  )
  -- Idempotent on the existing partial unique index. Second run inserts zero.
  ON CONFLICT ((data->>'gam_backfill_key')) WHERE data ? 'gam_backfill_key'
  DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- Prove the suppression held before this commits.
  SELECT count(*) INTO v_pushes
  FROM public.push_notification_queue
  WHERE created_at >= v_tx_start;

  IF v_pushes > 0 THEN
    RAISE EXCEPTION
      'ABORT: badge backfill queued % push rows (expected 0). Rolling back; no rows inserted.',
      v_pushes;
  END IF;

  RAISE NOTICE 'Badge backfill inserted % activity rows (% catalogue fallbacks), 0 pushes queued.',
    v_inserted, v_fallback;
END
$backfill$;