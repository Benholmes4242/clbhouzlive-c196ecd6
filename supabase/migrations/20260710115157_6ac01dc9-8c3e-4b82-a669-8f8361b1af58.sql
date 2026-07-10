CREATE OR REPLACE FUNCTION public.get_echo_engine_health_summary()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_latest jsonb;
  v_days7  jsonb;
  v_days14 jsonb;
  v_recent jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin required';
  END IF;

  -- Latest row per engine
  SELECT jsonb_agg(to_jsonb(t) ORDER BY t.engine)
  INTO v_latest
  FROM (
    SELECT DISTINCT ON (engine) engine, ok, ms, chars, model_id, error, checked_at
    FROM public.echo_engine_health
    ORDER BY engine, checked_at DESC
  ) t;

  -- 7-day per engine (one entry per day: latest that day) — legacy
  SELECT jsonb_agg(to_jsonb(d) ORDER BY d.engine, d.day)
  INTO v_days7
  FROM (
    SELECT DISTINCT ON (engine, day)
      engine,
      (checked_at AT TIME ZONE 'UTC')::date AS day,
      ok,
      ms,
      checked_at
    FROM public.echo_engine_health
    WHERE checked_at >= now() - interval '7 days'
    ORDER BY engine, day, checked_at DESC
  ) d;

  -- 14-day per engine (one entry per day: latest that day)
  SELECT jsonb_agg(to_jsonb(d) ORDER BY d.engine, d.day)
  INTO v_days14
  FROM (
    SELECT DISTINCT ON (engine, day)
      engine,
      (checked_at AT TIME ZONE 'UTC')::date AS day,
      ok,
      ms,
      checked_at
    FROM public.echo_engine_health
    WHERE checked_at >= now() - interval '14 days'
    ORDER BY engine, day, checked_at DESC
  ) d;

  -- Recent 20 rows across all engines
  SELECT jsonb_agg(to_jsonb(r) ORDER BY r.checked_at DESC)
  INTO v_recent
  FROM (
    SELECT engine, ok, ms, model_id, error, checked_at
    FROM public.echo_engine_health
    ORDER BY checked_at DESC
    LIMIT 20
  ) r;

  RETURN jsonb_build_object(
    'latest',  COALESCE(v_latest,  '[]'::jsonb),
    'days7',   COALESCE(v_days7,   '[]'::jsonb),
    'days14',  COALESCE(v_days14,  '[]'::jsonb),
    'recent',  COALESCE(v_recent,  '[]'::jsonb)
  );
END;
$$;