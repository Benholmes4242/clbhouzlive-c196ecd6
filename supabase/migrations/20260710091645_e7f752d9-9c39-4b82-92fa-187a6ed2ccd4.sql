
-- Video perf telemetry rollups: aggregates-only, no user-identifying data.
CREATE TABLE public.video_perf_rollups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid NOT NULL,
  flushed_at    timestamptz NOT NULL DEFAULT now(),
  app_build     text,
  device_class  text,
  is_debug      boolean NOT NULL DEFAULT false,
  row_kind      text NOT NULL CHECK (row_kind IN ('bucket','session','prefetch','feed','startlevel','decide')),
  kind          text,
  page          text,
  count         integer,
  p50           integer,
  p95           integer,
  worst         integer,
  pass          integer,
  slow          integer,
  timeout       integer,
  superseded    integer,
  extra         jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX video_perf_rollups_flushed_at_idx ON public.video_perf_rollups (flushed_at DESC);
CREATE INDEX video_perf_rollups_kind_page_idx  ON public.video_perf_rollups (row_kind, kind, page);
CREATE INDEX video_perf_rollups_session_idx    ON public.video_perf_rollups (session_id);

-- GRANTs — insert-only for public; admins read via policy.
GRANT INSERT ON public.video_perf_rollups TO anon;
GRANT INSERT, SELECT ON public.video_perf_rollups TO authenticated;
GRANT ALL ON public.video_perf_rollups TO service_role;

ALTER TABLE public.video_perf_rollups ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) may insert telemetry; no per-row check
-- because no user_id is stored.
CREATE POLICY "telemetry insert open"
  ON public.video_perf_rollups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admin-only read.
CREATE POLICY "admin can read telemetry"
  ON public.video_perf_rollups
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Nightly retention: keep 90 days.
SELECT cron.schedule(
  'video-perf-rollups-retention',
  '20 2 * * *',
  $$ DELETE FROM public.video_perf_rollups WHERE flushed_at < now() - interval '90 days' $$
);
