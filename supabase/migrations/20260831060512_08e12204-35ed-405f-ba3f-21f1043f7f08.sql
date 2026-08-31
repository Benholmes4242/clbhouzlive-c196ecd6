CREATE TABLE public.tour_stories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  kicker text,
  headline text NOT NULL,
  standfirst text,
  body text,
  image_url text,
  image_credit text,
  tour_slug text,
  tournament_id uuid REFERENCES public.sr_tournaments(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tour_stories_published_idx ON public.tour_stories (published_at DESC NULLS LAST);
CREATE INDEX tour_stories_tour_slug_idx ON public.tour_stories (tour_slug);

GRANT SELECT ON public.tour_stories TO anon;
GRANT SELECT ON public.tour_stories TO authenticated;
GRANT ALL ON public.tour_stories TO service_role;

ALTER TABLE public.tour_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published stories are readable by anyone"
  ON public.tour_stories FOR SELECT
  TO anon, authenticated
  USING (published_at IS NOT NULL AND published_at <= now());

CREATE TRIGGER tour_stories_set_updated_at
  BEFORE UPDATE ON public.tour_stories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();