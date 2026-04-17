-- 1. Add surface column to championship_editorial_daily
ALTER TABLE public.championship_editorial_daily
  ADD COLUMN IF NOT EXISTS surface TEXT NOT NULL DEFAULT 'top100'
    CHECK (surface IN ('top100', 'global'));

-- 2. Drop old unique indexes and recreate scoped by surface
DROP INDEX IF EXISTS public.championship_editorial_daily_unique_seasonal;
DROP INDEX IF EXISTS public.championship_editorial_daily_unique_alltime;

CREATE UNIQUE INDEX championship_editorial_daily_unique_seasonal_surface
  ON public.championship_editorial_daily (surface, season_id, time_filter, date)
  WHERE season_id IS NOT NULL;

CREATE UNIQUE INDEX championship_editorial_daily_unique_alltime_surface
  ON public.championship_editorial_daily (surface, time_filter, date)
  WHERE season_id IS NULL;

-- Helpful lookup index including surface
DROP INDEX IF EXISTS public.championship_editorial_daily_lookup_idx;
CREATE INDEX championship_editorial_daily_lookup_idx
  ON public.championship_editorial_daily (surface, time_filter, season_id, date DESC);

-- 3. New RPC: rank countries by Clbhouz member count
-- Uses user_exploration_stats.country_list (text[] of country names) as
-- the source of truth. Continent is derived in TypeScript via a small map
-- because golf_courses.continent uses regional groupings, not per-country.
CREATE OR REPLACE FUNCTION public.get_global_country_breakdown(
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  country TEXT,
  member_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    unnest(ues.country_list)::text AS country,
    COUNT(DISTINCT ues.user_id)    AS member_count
  FROM public.user_exploration_stats ues
  WHERE ues.country_list IS NOT NULL
    AND array_length(ues.country_list, 1) > 0
  GROUP BY country
  ORDER BY member_count DESC, country ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION public.get_global_country_breakdown TO authenticated, anon;