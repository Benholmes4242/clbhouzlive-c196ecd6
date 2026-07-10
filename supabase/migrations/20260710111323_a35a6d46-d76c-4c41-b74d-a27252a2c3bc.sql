-- Admin-gated read for echo_engine_health (service-role-only table).
-- Returns latest row per engine + last 7 days per engine (one dot per day: latest that day).

CREATE OR REPLACE FUNCTION public.get_echo_engine_health_summary()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_latest jsonb;
  v_days jsonb;
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

  -- 7-day per engine (one entry per day: latest that day)
  SELECT jsonb_agg(to_jsonb(d) ORDER BY d.engine, d.day)
  INTO v_days
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

  RETURN jsonb_build_object(
    'latest', COALESCE(v_latest, '[]'::jsonb),
    'days7',  COALESCE(v_days,   '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_echo_engine_health_summary() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_echo_engine_health_summary() FROM anon;