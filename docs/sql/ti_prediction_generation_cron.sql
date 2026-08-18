-- ─────────────────────────────────────────────────────────────────────────────
-- SCHEDULED PREDICTION GENERATION  (run by hand — no migration is created)
--
-- 1. The skip log. A row per INVOCATION, not per run.
-- 2. The cron job: Wednesday 20:00 UTC, tournaments starting in the next 2 days.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. SKIP LOG ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ti_generation_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          uuid NOT NULL,                  -- one value per cron fire
  tournament_id   uuid REFERENCES public.sr_tournaments(id) ON DELETE SET NULL,
  tournament_name text,
  tour_id         uuid,
  tour_name       text,
  start_date      date,
  generated       boolean NOT NULL DEFAULT false, -- was a prediction row written
  outcome         text NOT NULL,                  -- generated | already_current |
                                                  -- field_too_small | no_confirmed_field |
                                                  -- locked | error | dry_run
  field_count     integer,                        -- field/pool size at invocation
  detail          text,                           -- why, verbatim where possible
  duration_ms     integer,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ti_generation_log_created_idx
  ON public.ti_generation_log (created_at DESC);
CREATE INDEX IF NOT EXISTS ti_generation_log_run_idx
  ON public.ti_generation_log (run_id);

GRANT ALL ON public.ti_generation_log TO service_role;

ALTER TABLE public.ti_generation_log ENABLE ROW LEVEL SECURITY;

-- service_role writes it; admins read it.
CREATE POLICY "service role manages ti generation log"
  ON public.ti_generation_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "admins read ti generation log"
  ON public.ti_generation_log FOR SELECT TO authenticated
  USING (public.is_admin());   -- swap for your canonical admin predicate if different

GRANT SELECT ON public.ti_generation_log TO authenticated;

-- The morning-after query:
--   select start_date, tour_name, tournament_name, outcome, field_count, detail
--   from public.ti_generation_log
--   where created_at > now() - interval '18 hours'
--   order by start_date, tour_name;


-- ── 2. CRON: Wednesday 20:00 UTC, 2-day window (Thursday AND Friday starts) ──
select cron.schedule(
  'generate-predictions-weekly',
  '0 20 * * 3',
  $$
  select net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/schedule-predictions',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDg4OTgsImV4cCI6MjA2NTI4NDg5OH0.rVzRKRklmZoWMxZ-jHKfdrvf2uJjtoQuwVjPMb1I7Xw"}'::jsonb,
    body := '{"daysAhead": 2}'::jsonb,
    timeout_milliseconds := 300000
  ) as request_id;
  $$
);

-- ── 3. OPTIONAL catch-up: Thursday 20:00 UTC, 1-day window (Friday starts).
-- Costs nothing when Wednesday already succeeded (the function never passes
-- forceRegenerate, so a current row returns cached). Recommended because the
-- Boeing Classic (Fri 14 Aug) only had tee times at 19:24 UTC on the Wednesday
-- — 36 minutes of margin. See report item 3.
select cron.schedule(
  'generate-predictions-friday-catchup',
  '0 20 * * 4',
  $$
  select net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/schedule-predictions',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGtlaHlvbWNha3FqdnVobm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDg4OTgsImV4cCI6MjA2NTI4NDg5OH0.rVzRKRklmZoWMxZ-jHKfdrvf2uJjtoQuwVjPMb1I7Xw"}'::jsonb,
    body := '{"daysAhead": 1}'::jsonb,
    timeout_milliseconds := 300000
  ) as request_id;
  $$
);
