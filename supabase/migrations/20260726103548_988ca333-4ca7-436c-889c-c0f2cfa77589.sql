-- Bring gam_emit_legend_pulse_event into version control, enrich its
-- legend_lost payload, and unify the deduplication key with gam-evaluator.
--
-- Unified key on BOTH emitters:
--   legend_lost:{userId}:{course_id}:{category}:{YYYY-MM-DD (UTC)}
--
-- gam_legend_pulse_events inserts are unchanged. The outbox insert stays
-- (443 crown losses are only ever seen by this trigger).

CREATE OR REPLACE FUNCTION public.gam_emit_legend_pulse_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_previous_holder_id uuid;
  v_previous_value numeric;
  v_taker_name text;
  v_course_name text;
  v_utc_date text;
BEGIN
  IF NEW.rank <> 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.is_current IS NOT TRUE THEN
    RETURN NEW;
  END IF;

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

      -- Enrichment lookups. Indexed point selects, each isolated so a failure
      -- yields NULL rather than aborting the legend insert. Mirrors the
      -- evaluator's graceful degradation. NEVER read whs_friends /
      -- whs_friend_matches (England Golf PII).
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

      -- Venue-agnostic UTC date, identical to the evaluator's
      -- new Date().toISOString().slice(0, 10).
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
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Trigger definition, recorded for version control (idempotent).
DROP TRIGGER IF EXISTS gam_legend_pulse_emit ON public.gam_course_legends;
CREATE TRIGGER gam_legend_pulse_emit
AFTER INSERT ON public.gam_course_legends
FOR EACH ROW
WHEN (NEW.rank = 1 AND NEW.is_current = true)
EXECUTE FUNCTION public.gam_emit_legend_pulse_event();