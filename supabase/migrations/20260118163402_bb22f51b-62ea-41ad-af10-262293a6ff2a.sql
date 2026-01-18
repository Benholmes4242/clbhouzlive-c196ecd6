-- Step 1 (retry, in successful migration): Remove duplicate trigger on user_follows
DROP TRIGGER IF EXISTS trg_create_follow_notification ON public.user_follows;

-- Security hardening for newly-added function: fix mutable search_path warning
ALTER FUNCTION public.immutable_date_trunc_minute(timestamptz) SET search_path = public;