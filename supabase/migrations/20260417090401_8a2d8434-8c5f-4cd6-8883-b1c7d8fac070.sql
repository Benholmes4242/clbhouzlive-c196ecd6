ALTER TABLE public.championship_editorial_daily
  DROP CONSTRAINT IF EXISTS championship_editorial_daily_surface_check;

ALTER TABLE public.championship_editorial_daily
  ADD CONSTRAINT championship_editorial_daily_surface_check
  CHECK (surface IN ('top100', 'global', 'courses'));