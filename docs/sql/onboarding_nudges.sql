-- ─────────────────────────────────────────────────────────────────────────────
-- BRIEF_ONBOARDING_SEQUENCE — ledger, permanent email opt-out, daily cron.
-- Run by hand in the SQL editor. No migration.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. THE LEDGER ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.onboarding_nudges (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gap          text NOT NULL CHECK (gap IN ('whs','club','username')),
  channel      text NOT NULL CHECK (channel IN ('dm','push','email')),
  sent_at      timestamptz NOT NULL DEFAULT now(),
  resolved_at  timestamptz,
  UNIQUE (user_id, gap, channel)
);

CREATE INDEX IF NOT EXISTS onboarding_nudges_user_idx
  ON public.onboarding_nudges (user_id, gap);

ALTER TABLE public.onboarding_nudges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Panel admins read nudges" ON public.onboarding_nudges;
CREATE POLICY "Panel admins read nudges" ON public.onboarding_nudges
  FOR SELECT TO authenticated USING (public.is_panel_admin());

GRANT SELECT ON public.onboarding_nudges TO authenticated;

-- ── 2. PERMANENT EMAIL OPT-OUT ───────────────────────────────────────────────
-- Honoured by every future sequence, not just this one. Written by the
-- onboarding-unsubscribe edge function (service role), read by the job.
CREATE TABLE IF NOT EXISTS public.email_unsubscribes (
  user_id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text,
  source          text,
  unsubscribed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Panel admins read unsubscribes" ON public.email_unsubscribes;
CREATE POLICY "Panel admins read unsubscribes" ON public.email_unsubscribes
  FOR SELECT TO authenticated USING (public.is_panel_admin());

DROP POLICY IF EXISTS "Members read own unsubscribe" ON public.email_unsubscribes;
CREATE POLICY "Members read own unsubscribe" ON public.email_unsubscribes
  FOR SELECT TO authenticated USING (user_id = auth.uid());

GRANT SELECT ON public.email_unsubscribes TO authenticated;

-- ── 3. THE DAILY JOB — 04:20 UTC, off-peak, once ─────────────────────────────
-- Replace <CRON_SECRET> with the CRON_SECRET function secret.
-- The jobname is picked up automatically by public.get_cron_job_health().
SELECT cron.unschedule('onboarding-nudge-sequence')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'onboarding-nudge-sequence');

SELECT cron.schedule(
  'onboarding-nudge-sequence',
  '20 4 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/onboarding-nudges',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body := jsonb_build_object('limit', 200)
  );
  $$
);

-- ── Verify ───────────────────────────────────────────────────────────────────
-- select jobname, schedule, active from cron.job where jobname = 'onboarding-nudge-sequence';
-- select * from public.get_cron_job_health() where jobname = 'onboarding-nudge-sequence';
-- select gap, channel, count(*) from public.onboarding_nudges group by 1,2 order by 1,2;
-- select user_id, gap, channel, sent_at, resolved_at from public.onboarding_nudges order by sent_at desc limit 30;
