DO $mig$
DECLARE
  v_name text;
  v_def  text;
  v_new  text;
BEGIN
  FOR v_name IN
    SELECT unnest(ARRAY[
      'refresh_discover_feats',
      'refresh_eagle_leaders',
      'refresh_legendary_leaders',
      'refresh_latest_records_cache'
    ])
  LOOP
    SELECT pg_get_functiondef(p.oid)
      INTO v_def
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = v_name
    LIMIT 1;

    IF v_def IS NULL THEN
      RAISE NOTICE 'skip: %', v_name;
      CONTINUE;
    END IF;

    v_new := replace(v_def, 'LIMIT 200', 'LIMIT 500');

    IF v_new = v_def THEN
      RAISE NOTICE 'no cap found in %', v_name;
    ELSE
      EXECUTE v_new;
      RAISE NOTICE 'raised cap in %', v_name;
    END IF;
  END LOOP;
END
$mig$;

SELECT public.refresh_discover_feats();
SELECT public.refresh_eagle_leaders();
SELECT public.refresh_legendary_leaders();
SELECT public.refresh_latest_records_cache();