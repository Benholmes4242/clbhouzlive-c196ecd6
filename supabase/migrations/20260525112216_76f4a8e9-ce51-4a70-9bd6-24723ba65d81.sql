-- Recompute per-list distinct rated course counts into gam_user_milestones
CREATE OR REPLACE FUNCTION public.recompute_user_top100_milestones(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  list_record RECORD;
  user_count INTEGER;
  metric_name TEXT;
BEGIN
  FOR list_record IN
    SELECT slug FROM top100_lists WHERE is_active = true
  LOOP
    metric_name := CASE list_record.slug
      WHEN 'global' THEN 'top_100_worldwide_distinct'
      WHEN 'usa'    THEN 'top_100_usa_distinct'
      WHEN 'gb-i'   THEN 'top_100_gbni_distinct'
      WHEN 'europe' THEN 'top_100_europe_distinct'
      ELSE NULL
    END;

    IF metric_name IS NULL THEN CONTINUE; END IF;

    SELECT COUNT(DISTINCT ctm.course_id)::INTEGER INTO user_count
    FROM course_top100_memberships ctm
    JOIN top100_lists tl ON tl.id = ctm.list_id AND tl.slug = list_record.slug
    JOIN course_ratings cr ON cr.course_id = ctm.course_id
    WHERE cr.user_id = p_user_id
      AND cr.rating IS NOT NULL;

    INSERT INTO gam_user_milestones (user_id, metric, count, last_at, updated_at)
    VALUES (p_user_id, metric_name, user_count, NOW(), NOW())
    ON CONFLICT (user_id, metric)
    DO UPDATE SET
      count = EXCLUDED.count,
      last_at = EXCLUDED.last_at,
      updated_at = EXCLUDED.updated_at
    WHERE gam_user_milestones.count IS DISTINCT FROM EXCLUDED.count;
  END LOOP;
END;
$$;

-- Evaluate the 4 regional Top 100 badges for a single user, awarding/upgrading tiers as needed
CREATE OR REPLACE FUNCTION public.evaluate_user_top100_badges(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  b RECORD;
  v_count INTEGER;
  v_tier INTEGER;
  v_existing_tier INTEGER;
  v_existing_seen BOOLEAN;
  v_has_existing BOOLEAN;
  v_threshold INTEGER;
  i INTEGER;
BEGIN
  FOR b IN
    SELECT id, counter_metric, counter_tiers
    FROM gam_badge_catalogue
    WHERE is_active = true
      AND id IN ('top_100_worldwide','top_100_usa','top_100_gbni','top_100_europe')
  LOOP
    SELECT count INTO v_count
    FROM gam_user_milestones
    WHERE user_id = p_user_id AND metric = b.counter_metric;
    v_count := COALESCE(v_count, 0);

    -- Highest tier where v_count >= tiers[i]
    v_tier := -1;
    IF jsonb_typeof(b.counter_tiers) = 'array' THEN
      FOR i IN 0 .. jsonb_array_length(b.counter_tiers) - 1 LOOP
        v_threshold := (b.counter_tiers ->> i)::INTEGER;
        IF v_count >= v_threshold THEN
          v_tier := i;
        END IF;
      END LOOP;
    END IF;

    SELECT counter_tier, seen_by_user, TRUE
      INTO v_existing_tier, v_existing_seen, v_has_existing
    FROM gam_user_badges
    WHERE user_id = p_user_id AND badge_id = b.id;

    IF v_tier >= 0 AND (NOT v_has_existing OR COALESCE(v_existing_tier, -1) < v_tier) THEN
      INSERT INTO gam_user_badges (
        user_id, badge_id, counter_value, counter_tier,
        earned_at, seen_by_user, updated_at
      )
      VALUES (
        p_user_id, b.id, v_count, v_tier,
        NOW(), FALSE, NOW()
      )
      ON CONFLICT (user_id, badge_id) DO UPDATE SET
        counter_value = EXCLUDED.counter_value,
        counter_tier  = EXCLUDED.counter_tier,
        seen_by_user  = FALSE,
        updated_at    = NOW();

      -- Notification (best-effort)
      BEGIN
        INSERT INTO gam_notification_outbox (user_id, kind, payload, created_at)
        VALUES (
          p_user_id,
          'badge_earned',
          jsonb_build_object('badge_id', b.id, 'counter_tier', v_tier, 'counter_value', v_count),
          NOW()
        );
      EXCEPTION WHEN undefined_table OR undefined_column THEN
        NULL;
      END;
    ELSIF v_has_existing THEN
      UPDATE gam_user_badges
      SET counter_value = v_count, updated_at = NOW()
      WHERE user_id = p_user_id AND badge_id = b.id;
    END IF;
  END LOOP;
END;
$$;

-- Trigger function: on rating insert/update, recompute milestones and re-evaluate the 4 badges
CREATE OR REPLACE FUNCTION public.trigger_top100_milestone_on_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.recompute_user_top100_milestones(NEW.user_id);
  PERFORM public.evaluate_user_top100_badges(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_top100_milestone_on_rating ON public.course_ratings;
CREATE TRIGGER trg_top100_milestone_on_rating
AFTER INSERT OR UPDATE OF rating ON public.course_ratings
FOR EACH ROW
WHEN (NEW.rating IS NOT NULL)
EXECUTE FUNCTION public.trigger_top100_milestone_on_rating();

-- One-time backfill
DO $$
DECLARE
  u RECORD;
  total INTEGER := 0;
BEGIN
  FOR u IN
    SELECT DISTINCT user_id FROM public.course_ratings WHERE rating IS NOT NULL
  LOOP
    PERFORM public.recompute_user_top100_milestones(u.user_id);
    PERFORM public.evaluate_user_top100_badges(u.user_id);
    total := total + 1;
  END LOOP;
  RAISE NOTICE 'Backfilled Top 100 milestones for % users', total;
END;
$$;