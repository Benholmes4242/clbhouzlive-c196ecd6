CREATE OR REPLACE FUNCTION public.gam_emit_legend_pulse_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_previous_holder_id uuid;
  v_previous_value     numeric;
  v_taker_name         text;
  v_course_name        text;
  v_label              text;
  v_utc_date           text;
  v_enqueued           integer;
  v_fresh              boolean;
  v_is_all_time        boolean;
  v_existing_id        uuid;
  v_count              integer;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.rank = 1 THEN
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

    -- FRESHNESS GATE (2026-08-28). Handicap backfill rewrites all-time crowns
    -- wholesale: one sync carried 189 rounds with play dates back to 2021, and
    -- every displaced holder was told they had lost a crown. True, and about
    -- nothing -- nobody played. attained_at IS the play date of the record
    -- round, so a crown attained more than 2 days ago is backfill.
    -- The PULSE EVENTS above are unaffected: they are a history, not a telling.
    -- Matches LEGEND_NOTIFY_MAX_AGE_DAYS = 2 in gam-evaluator.
    v_fresh := NEW.attained_at IS NOT NULL
               AND NEW.attained_at >= ((now() AT TIME ZONE 'utc')::date - 2);

    -- BRIEF_CROWN_NOTIFICATION_COALESCING S1 (2026-08-29).
    -- 90-DAY CROWNS DO NOT NOTIFY. This is the SQL TWIN of the evaluator's
    -- `cfg.windowDays === null` test in gam-evaluator/index.ts recomputeLegend().
    -- This trigger has no access to LEGEND_CATS, so it must test the category
    -- itself; the test is POSITIVE on all-time so that a renamed category or a
    -- third window fails CLOSED (no notification) rather than fanning out.
    -- These two tests are a PAIR -- change one, change the other.
    -- The board write, the pulse events above, and every 90-day surface are
    -- UNTOUCHED: this changes who gets told, never what is true.
    v_is_all_time := NEW.category LIKE '%\_all\_time';

    IF v_previous_holder_id IS NOT NULL THEN
      INSERT INTO public.gam_legend_pulse_events
        (kind, course_id, category, user_id, counterparty_user_id, category_value, occurred_at)
      VALUES
        ('threat', NEW.course_id, NEW.category, v_previous_holder_id, NEW.user_id, NEW.value, NEW.attained_at);
    END IF;

    IF v_previous_holder_id IS NOT NULL AND v_fresh AND v_is_all_time THEN
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

      v_label := public.gam_legend_category_label(NEW.category);
      v_utc_date := to_char((now() AT TIME ZONE 'utc')::date, 'YYYY-MM-DD');

      -- BRIEF_CROWN_NOTIFICATION_COALESCING S2 (2026-08-29). THE CATEGORY IS
      -- GONE FROM THE DEDUP KEY. One round can take several all-time records at
      -- one course and the category never reached the message, so the member
      -- received the same sentence several times. The key now collapses to
      -- member + course + UTC day; the first record inserts and the rest are
      -- absorbed below and counted into that one row.
      -- Matches dedupKey('legend_lost') in gam-evaluator/index.ts exactly.
      -- The 24h dedup skip is unaffected: the key still carries the UTC date.
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
            'category_label',     v_label,
            'taken_by',           NEW.user_id,
            'new_holder_user_id', NEW.user_id,
            'taker_name',         v_taker_name,
            'course_name',        v_course_name,
            'new_value',          NEW.value
          ),
          'legend_lost:' || v_previous_holder_id::text || ':' || NEW.course_id::text || ':' || v_utc_date,
          'medium',
          now()
        )
      ON CONFLICT DO NOTHING;

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
              'Legend lost',
              CASE WHEN v_label IS NOT NULL
                THEN COALESCE(v_taker_name, 'Someone') || ' beat your ' || v_label || ' at ' || COALESCE(v_course_name, 'this course') || '.'
                ELSE COALESCE(v_taker_name, 'Someone') || ' took your legend title at ' || COALESCE(v_course_name, 'this course') || '.'
              END,
              jsonb_build_object(
                'course_id',          NEW.course_id,
                'category',           NEW.category,
                'category_label',     v_label,
                'taken_by',           NEW.user_id,
                'new_holder_user_id', NEW.user_id,
                'taker_name',         v_taker_name,
                'course_name',        v_course_name,
                'new_value',          NEW.value,
                'record_count',       1
              ),
              'course',
              NEW.course_id,
              NULL
            );
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
      ELSE
        -- COALESCE (2.2). The outbox insert was absorbed by the collapsed key,
        -- so this member has already been told about a record at this course
        -- today: this is the 2nd..nth of the burst. Bump the count on that one
        -- row and rewrite its sentence. Scoped by entity_id so a second course
        -- in the same batch stays its own notification (2.4).
        -- The evaluator coalesces legend_EARNED; this trigger owns legend_LOST
        -- end to end, so exactly one bumper exists per type.
        BEGIN
          SELECT n.id, COALESCE((n.data ->> 'record_count')::int, 1)
          INTO v_existing_id, v_count
          FROM public.notifications n
          WHERE n.user_id = v_previous_holder_id
            AND n.type = 'legend_lost'
            AND n.entity_id = NEW.course_id
            AND n.created_at >= ((now() AT TIME ZONE 'utc')::date)::timestamptz
          ORDER BY n.created_at DESC
          LIMIT 1;

          IF v_existing_id IS NOT NULL THEN
            v_count := v_count + 1;
            UPDATE public.notifications n
            SET message = COALESCE(v_taker_name, 'Someone')
                          || ' beat ' || v_count::text || ' of your course records at '
                          || COALESCE(v_course_name, 'this course') || '.',
                data = COALESCE(n.data, '{}'::jsonb)
                       || jsonb_build_object('record_count', v_count, 'coalesced', true)
            WHERE n.id = v_existing_id;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;