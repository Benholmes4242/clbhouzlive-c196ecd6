CREATE TABLE public.tour_hub_dispatch_moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES public.sr_tournaments(id) ON DELETE SET NULL,
  headline text NOT NULL,
  caption text,
  duration_seconds integer,
  stream_id text,
  poster_url text,
  published_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  priority integer NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tour_hub_dispatch_moments TO anon;
GRANT SELECT ON public.tour_hub_dispatch_moments TO authenticated;
GRANT ALL ON public.tour_hub_dispatch_moments TO service_role;

ALTER TABLE public.tour_hub_dispatch_moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published moments"
  ON public.tour_hub_dispatch_moments
  FOR SELECT
  USING (status = 'published' AND (expires_at IS NULL OR expires_at > now()));

CREATE INDEX idx_dispatch_moments_published
  ON public.tour_hub_dispatch_moments (published_at DESC)
  WHERE status = 'published';

CREATE INDEX idx_dispatch_moments_tournament
  ON public.tour_hub_dispatch_moments (tournament_id);

CREATE TRIGGER set_dispatch_moments_updated_at
  BEFORE UPDATE ON public.tour_hub_dispatch_moments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();