
CREATE TABLE IF NOT EXISTS public.ti_generation_locks (
  tournament_id uuid PRIMARY KEY,
  acquired_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.ti_generation_locks TO service_role;

ALTER TABLE public.ti_generation_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages ti locks"
  ON public.ti_generation_locks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
