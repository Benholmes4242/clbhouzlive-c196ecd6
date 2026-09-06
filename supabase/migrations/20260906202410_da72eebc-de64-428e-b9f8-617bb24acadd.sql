DO $$
DECLARE
  r record;
  new_def text;
  note constant text := 'COALESCE(plq.like_count, 0)::bigint AS cnt /* posts.like_count is a denormalised integer column (it used to be a COUNT(*)); this result slot is declared bigint, so the cast is required — without it Postgres raises 42804 the moment the function returns a row. */';
BEGIN
  FOR r IN
    SELECT p.oid,
           p.proname,
           pg_get_function_identity_arguments(p.oid) AS args,
           pg_get_functiondef(p.oid) AS d
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND p.proname IN (
        'get_course_media','get_course_media_v2',
        'get_explore_feed','get_explore_feed_v2',
        'get_watch_mixed_grid','get_watch_mixed_grid_v2'
      )
      AND pg_get_functiondef(p.oid) LIKE '%COALESCE(plq.like_count, 0) AS cnt%'
  LOOP
    new_def := replace(r.d, 'COALESCE(plq.like_count, 0) AS cnt', note);
    IF new_def = r.d THEN
      RAISE EXCEPTION 'no replacement made for %(%)', r.proname, r.args;
    END IF;
    EXECUTE new_def;
    RAISE NOTICE 'patched %(%)', r.proname, r.args;
  END LOOP;
END $$;