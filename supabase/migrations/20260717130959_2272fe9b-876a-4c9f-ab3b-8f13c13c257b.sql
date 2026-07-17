SELECT cron.unschedule('test-internal-secret-guard-once');
DROP FUNCTION IF EXISTS public.upsert_internal_fn_secret(text);