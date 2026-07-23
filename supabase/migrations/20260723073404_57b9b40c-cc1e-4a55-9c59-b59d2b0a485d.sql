
-- 1. Trigger: preserve non-fatal behaviour, but record the failure to analytics_events
CREATE OR REPLACE FUNCTION public.auto_queue_push_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  inserted_count integer := 0;
  base_data jsonb;
BEGIN
  base_data := jsonb_build_object(
    'notification_id', NEW.id,
    'type',            COALESCE(NEW.type, ''),
    'entity_type',     COALESCE(NEW.entity_type, ''),
    'entity_id',       COALESCE(NEW.entity_id::text, ''),
    'actor_user_id',   COALESCE(NEW.actor_id::text, '')
  ) || COALESCE(NEW.data, '{}'::jsonb);

  IF NEW.recipient_actor_type = 'business' THEN
    IF EXISTS (
      SELECT 1
        FROM jsonb_array_elements_text(
               COALESCE(
                 (SELECT (notification_preferences->'muted_types')
                    FROM public.business_accounts
                   WHERE id = NEW.recipient_actor_id),
                 '[]'::jsonb
               )
             ) AS t(val)
       WHERE t.val = NEW.type
    ) THEN
      RETURN NEW;
    END IF;

    INSERT INTO push_notification_queue (user_id, device_id, title, body, data)
    SELECT
      bm.user_profile_id,
      upd.onesignal_external_id,
      COALESCE(NEW.title, 'New Notification'),
      COALESCE(NULLIF(TRIM(NEW.message), ''), NEW.title, 'New notification'),
      base_data || jsonb_build_object(
        'recipient_actor_type', NEW.recipient_actor_type,
        'recipient_actor_id',   NEW.recipient_actor_id
      )
    FROM business_members bm
    JOIN user_push_devices upd
      ON upd.user_id = bm.user_profile_id
     AND upd.enabled = true
     AND upd.onesignal_external_id IS NOT NULL
    WHERE bm.business_id = NEW.recipient_actor_id
      AND bm.role IN ('owner', 'admin', 'editor');
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
  ELSE
    INSERT INTO push_notification_queue (user_id, device_id, title, body, data)
    SELECT
      NEW.user_id,
      upd.onesignal_external_id,
      COALESCE(NEW.title, 'New Notification'),
      COALESCE(NULLIF(TRIM(NEW.message), ''), NEW.title, 'New notification'),
      base_data || jsonb_build_object(
        'recipient_actor_type', COALESCE(NEW.recipient_actor_type, 'personal'),
        'recipient_actor_id',   COALESCE(NEW.recipient_actor_id, NEW.user_id)
      )
    FROM user_push_devices upd
    WHERE upd.user_id = NEW.user_id
      AND upd.enabled = true
      AND upd.onesignal_external_id IS NOT NULL;
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Non-fatal: still emit the notification, but surface the failure so it is diagnosable
  -- without reading Postgres logs. Wrapped in its own EXCEPTION so a broken analytics
  -- insert cannot cascade back into the outer handler.
  BEGIN
    INSERT INTO public.analytics_events (name, user_id, props)
    VALUES (
      'push_enqueue_failure',
      NEW.user_id,
      jsonb_build_object(
        'notification_id', NEW.id,
        'type',            NEW.type,
        'recipient_actor_type', NEW.recipient_actor_type,
        'recipient_actor_id',   NEW.recipient_actor_id,
        'sqlstate',        SQLSTATE,
        'sqlerrm',         SQLERRM
      )
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RAISE WARNING 'auto_queue_push_notification failed notif_id=% type=% sqlstate=% sqlerrm=%',
    NEW.id, NEW.type, SQLSTATE, SQLERRM;
  RETURN NEW;
END;
$function$;

-- 2. RPC: add 60-minute watchdog + drive status from it, expose latest enqueue-failure message
CREATE OR REPLACE FUNCTION public.get_push_health_summary()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pending          int;
  v_oldest_pending_m numeric;
  v_last_sent        timestamptz;
  v_queued_24h       int;
  v_sent_24h         int;
  v_errored_24h      int;
  v_expired_24h      int;
  v_errors           jsonb;
  v_p50_ms           numeric;
  v_max_ms           numeric;
  v_notifs_24h       int;
  v_devices          jsonb;
  v_cron             jsonb;
  v_types_7d         jsonb;
  v_status           text := 'green';
  v_reasons          jsonb := '[]'::jsonb;
  v_elig_60m         int := 0;
  v_queued_60m       int := 0;
  v_missing_60m      int := 0;
  v_enqueue_ok       boolean := true;
  v_latest_err       text;
  v_latest_err_at    timestamptz;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin required';
  END IF;

  SELECT count(*) FILTER (WHERE sent_at IS NULL AND error IS NULL),
         EXTRACT(epoch FROM (now() - min(created_at)
           FILTER (WHERE sent_at IS NULL AND error IS NULL))) / 60,
         max(sent_at)
    INTO v_pending, v_oldest_pending_m, v_last_sent
    FROM push_notification_queue;

  SELECT count(*),
         count(*) FILTER (WHERE sent_at IS NOT NULL),
         count(*) FILTER (WHERE error IS NOT NULL AND error <> 'expired_stale'),
         count(*) FILTER (WHERE error = 'expired_stale')
    INTO v_queued_24h, v_sent_24h, v_errored_24h, v_expired_24h
    FROM push_notification_queue
   WHERE created_at > now() - interval '24 hours';

  SELECT COALESCE(jsonb_agg(jsonb_build_object('error', e, 'count', n) ORDER BY n DESC), '[]'::jsonb)
    INTO v_errors
    FROM (SELECT error AS e, count(*) AS n
            FROM push_notification_queue
           WHERE error IS NOT NULL AND created_at > now() - interval '24 hours'
           GROUP BY error LIMIT 10) t;

  SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(epoch FROM (sent_at - created_at)) * 1000),
         max(EXTRACT(epoch FROM (sent_at - created_at)) * 1000)
    INTO v_p50_ms, v_max_ms
    FROM push_notification_queue
   WHERE sent_at IS NOT NULL AND created_at > now() - interval '24 hours';

  -- 24h eligible: personal recipients only, mirrors legacy behaviour (kept for trend).
  SELECT count(*)
    INTO v_notifs_24h
    FROM notifications n
   WHERE n.created_at > now() - interval '24 hours'
     AND EXISTS (SELECT 1 FROM user_push_devices d
                  WHERE d.user_id = n.user_id AND d.enabled = true
                    AND d.onesignal_external_id IS NOT NULL);

  -- 60m eligible: mirror the trigger's skip conditions exactly (personal + business paths).
  WITH recent_notifs AS (
    SELECT n.id, n.type, n.user_id, n.recipient_actor_type, n.recipient_actor_id
      FROM notifications n
     WHERE n.created_at > now() - interval '60 minutes'
  )
  SELECT count(*) INTO v_elig_60m
    FROM recent_notifs n
   WHERE (
      (n.recipient_actor_type IS NULL OR n.recipient_actor_type <> 'business')
      AND EXISTS (
        SELECT 1 FROM user_push_devices d
         WHERE d.user_id = n.user_id AND d.enabled = true
           AND d.onesignal_external_id IS NOT NULL
      )
    ) OR (
      n.recipient_actor_type = 'business'
      AND NOT EXISTS (
        SELECT 1
          FROM jsonb_array_elements_text(
                 COALESCE(
                   (SELECT (notification_preferences->'muted_types')
                      FROM business_accounts WHERE id = n.recipient_actor_id),
                   '[]'::jsonb
                 )
               ) AS t(val)
         WHERE t.val = n.type
      )
      AND EXISTS (
        SELECT 1
          FROM business_members bm
          JOIN user_push_devices d ON d.user_id = bm.user_profile_id
         WHERE bm.business_id = n.recipient_actor_id
           AND bm.role IN ('owner','admin','editor')
           AND d.enabled = true
           AND d.onesignal_external_id IS NOT NULL
      )
    );

  -- Distinct notifications observed in the queue in the last 60m (queue holds 1+ rows per notif).
  SELECT count(DISTINCT (data->>'notification_id'))
    INTO v_queued_60m
    FROM push_notification_queue
   WHERE created_at > now() - interval '60 minutes'
     AND data ? 'notification_id';

  v_missing_60m := GREATEST(v_elig_60m - v_queued_60m, 0);

  -- Latest recorded enqueue-failure surface (analytics_events).
  SELECT props->>'sqlerrm', created_at
    INTO v_latest_err, v_latest_err_at
    FROM analytics_events
   WHERE name = 'push_enqueue_failure'
     AND created_at > now() - interval '24 hours'
   ORDER BY created_at DESC
   LIMIT 1;

  SELECT jsonb_build_object(
           'total', count(*),
           'enabled', count(*) FILTER (WHERE enabled),
           'ios', count(*) FILTER (WHERE platform = 'ios' AND enabled),
           'android', count(*) FILTER (WHERE platform = 'android' AND enabled))
    INTO v_devices
    FROM user_push_devices;

  BEGIN
    SELECT jsonb_build_object('status', status, 'last_run', end_time,
             'minutes_ago', round(EXTRACT(epoch FROM (now() - end_time)) / 60))
      INTO v_cron
      FROM cron.job_run_details
     WHERE jobid = 72
     ORDER BY end_time DESC NULLS LAST LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_cron := jsonb_build_object('status', 'unknown');
  END;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('type', t, 'count', n) ORDER BY n DESC), '[]'::jsonb)
    INTO v_types_7d
    FROM (SELECT type AS t, count(*) AS n FROM notifications
           WHERE created_at > now() - interval '7 days'
           GROUP BY type ORDER BY count(*) DESC LIMIT 15) t;

  -- Verdict: driven by the 60m window.
  IF v_missing_60m >= 3 OR (v_elig_60m >= 3 AND v_queued_60m = 0) THEN
    v_enqueue_ok := false;
    v_status := 'red';
    v_reasons := v_reasons || to_jsonb(
      ('Enqueue hop broken: '||v_missing_60m||' of '||v_elig_60m||' eligible notifications not queued in last 60m')::text
    );
  ELSIF v_missing_60m BETWEEN 1 AND 2 THEN
    v_status := 'amber';
    v_reasons := v_reasons || to_jsonb(
      (v_missing_60m||' eligible notification(s) not queued in last 60m')::text
    );
  END IF;

  IF v_latest_err IS NOT NULL THEN
    IF v_status = 'green' THEN v_status := 'amber'; END IF;
    v_reasons := v_reasons || to_jsonb(('Enqueue failure recorded: '||v_latest_err)::text);
  END IF;

  IF v_oldest_pending_m > 15 THEN
    v_status := 'red';
    v_reasons := v_reasons || to_jsonb('Pending rows older than 15 minutes: drain may be down'::text);
  END IF;
  IF (v_cron->>'status') = 'failed' THEN
    v_status := 'red';
    v_reasons := v_reasons || to_jsonb('Sweeper cron last run failed'::text);
  END IF;
  IF v_status <> 'red' THEN
    IF v_errored_24h > 0 THEN
      v_status := 'amber';
      v_reasons := v_reasons || to_jsonb((v_errored_24h || ' send errors in last 24h')::text);
    END IF;
    IF v_expired_24h > 0 THEN
      v_status := 'amber';
      v_reasons := v_reasons || to_jsonb((v_expired_24h || ' rows expired stale in last 24h')::text);
    END IF;
    IF v_oldest_pending_m > 5 THEN
      v_status := 'amber';
      v_reasons := v_reasons || to_jsonb('Pending rows older than 5 minutes'::text);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'status', v_status,
    'reasons', v_reasons,
    'checked_at', now(),
    'queue', jsonb_build_object(
      'pending_now', COALESCE(v_pending, 0),
      'oldest_pending_minutes', round(COALESCE(v_oldest_pending_m, 0), 1),
      'last_sent_at', v_last_sent,
      'queued_24h', v_queued_24h,
      'sent_24h', v_sent_24h,
      'errored_24h', v_errored_24h,
      'expired_24h', v_expired_24h,
      'error_breakdown_24h', v_errors,
      'latency_p50_ms', round(COALESCE(v_p50_ms, 0)),
      'latency_max_ms', round(COALESCE(v_max_ms, 0))),
    'watchdog', jsonb_build_object(
      'notifications_24h_push_eligible', v_notifs_24h,
      'queue_rows_24h', v_queued_24h,
      'notifications_60m_push_eligible', v_elig_60m,
      'queue_rows_60m', v_queued_60m,
      'missing_60m', v_missing_60m,
      'enqueue_ok', v_enqueue_ok,
      'latest_error', v_latest_err,
      'latest_error_at', v_latest_err_at),
    'devices', v_devices,
    'cron', COALESCE(v_cron, jsonb_build_object('status', 'unknown')),
    'volume_7d_by_type', v_types_7d
  );
END;
$function$;
