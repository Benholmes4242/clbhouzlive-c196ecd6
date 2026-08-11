CREATE OR REPLACE FUNCTION public.gam_emit_legend_pulse_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_previous_holder_id uuid;
  v_previous_value     numeric;
  v_taker_name         text;
  v_course_name        text;
  v_utc_date           text;
  v_enqueued           integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT user_id, value
    INTO v_previous_holder_id, v_previous_value
    FROM public.gam_course_legends
    WHERE course_id = NEW.course_id
      AND category = NEW.category
      AND rank = 1
      AND is_current = false
      AND user_id <> NEW.user_id
    ORDER BY updated_at DESC
    LIMIT 1;

    INSERT INTO public.gam_legend_pulse_events
      (kind, course_id, category, user_id, counterparty_user_id, category_value, occurred_at)
    VALUES
      ('win', NEW.course_id, NEW.category, NEW.user_id, v_previous_holder_id, NEW.value, NEW.attained_at);

    IF v_previous_holder_id IS NOT NULL THEN
      INSERT INTO public.gam_legend_pulse_events
        (kind, course_id, category, user_id, counterparty_user_id, category_value, occurred_at)
      VALUES
        ('threat', NEW.course_id, NEW.category, v_previous_holder_id, NEW.user_id, NEW.value, NEW.attained_at);

      BEGIN
        SELECT NULLIF(BTRIM(COALESCE(NULLIF(BTRIM(COALESCE(up.display_name, '')), ''), up.username, '')), '')
        INTO v_taker_name
        FROM public.user_profiles up
        WHERE up.id = NEW.user_id;
      EXCEPTION WHEN OTHERS THEN
        v_taker_name := NULL;
      END;

      BEGIN
        SELECT NULLIF(BTRIM(COALESCE(gc.name, '')), '')
        INTO v_course_name
        FROM public.golf_courses gc
        WHERE gc.id = NEW.course_id;
      EXCEPTION WHEN OTHERS THEN
        v_course_name := NULL;
      END;

      v_utc_date := to_char((now() AT TIME ZONE 'utc')::date, 'YYYY-MM-DD');

      INSERT INTO public.gam_notification_outbox
        (user_id, notification_type, template_id, template_payload, deduplication_key, urgency, scheduled_for)
      VALUES
        (
          v_previous_holder_id,
          'legend_lost',
          'legend_lost_v1',
          jsonb_build_object(
            'course_id',          NEW.course_id,
            'category',           NEW.category,
            'taken_by',           NEW.user_id,
            'new_holder_user_id', NEW.user_id,
            'taker_name',         v_taker_name,
            'course_name',        v_course_name,
            'new_value',          NEW.value
          ),
          'legend_lost:' || v_previous_holder_id::text || ':' || NEW.course_id::text || ':' || NEW.category || ':' || v_utc_date,
          'medium',
          now()
        )
      ON CONFLICT DO NOTHING;

      -- Activity ledger mirror.
      --
      -- gam_notification_outbox is a pure DELIVERY QUEUE; the Activity page
      -- reads public.notifications via get_activity_feed. This trigger — not
      -- the evaluator — is the real producer of legend_lost, so the mirror has
      -- to live here. The evaluator's enqueueNotification() also fires for
      -- legend_lost, but this insert always wins the dedup key, so its
      -- upsert returns zero rows and its writeActivityRow() never runs.
      --
      -- Copy MUST stay identical to activityCopy('legend_lost') in
      -- supabase/functions/gam-evaluator/index.ts.
      GET DIAGNOSTICS v_enqueued = ROW_COUNT;
      IF v_enqueued > 0 THEN
        BEGIN
          INSERT INTO public.notifications
            (user_id, recipient_actor_type, recipient_actor_id, type, title, message, data, entity_type, entity_id, actor_id)
          VALUES
            (
              v_previous_holder_id,
              'personal',
              v_previous_holder_id,
              'legend_lost',
              'Crown lost',
              COALESCE(v_taker_name, 'Someone') || ' took your legend title at ' || COALESCE(v_course_name, 'this course') || '.',
              jsonb_build_object(
                'course_id',          NEW.course_id,
                'category',           NEW.category,
                'taken_by',           NEW.user_id,
                'new_holder_user_id', NEW.user_id,
                'taker_name',         v_taker_name,
                'course_name',        v_course_name,
                'new_value',          NEW.value
              ),
              'course',
              NEW.course_id,
              NULL
            );
        EXCEPTION WHEN OTHERS THEN
          -- Never let the ledger mirror abort a legend crowning.
          NULL;
        END;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;