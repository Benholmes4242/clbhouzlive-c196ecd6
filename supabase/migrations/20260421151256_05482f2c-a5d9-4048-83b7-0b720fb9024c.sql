-- Lock down the materialized view so it isn't exposed via PostgREST.
REVOKE ALL ON public.creator_quality_scores FROM anon, authenticated;
