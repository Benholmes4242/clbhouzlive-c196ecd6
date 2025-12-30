-- Update RLS policies to use the is_admin() function that's used elsewhere

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can read sr_seasons" ON public.sr_seasons;
DROP POLICY IF EXISTS "Admins can insert sr_seasons" ON public.sr_seasons;
DROP POLICY IF EXISTS "Admins can update sr_seasons" ON public.sr_seasons;

DROP POLICY IF EXISTS "Admins can read sr_tournaments" ON public.sr_tournaments;
DROP POLICY IF EXISTS "Admins can insert sr_tournaments" ON public.sr_tournaments;
DROP POLICY IF EXISTS "Admins can update sr_tournaments" ON public.sr_tournaments;

DROP POLICY IF EXISTS "Admins can read sr_sync_log" ON public.sr_sync_log;
DROP POLICY IF EXISTS "Admins can insert sr_sync_log" ON public.sr_sync_log;

-- Recreate with is_admin() function
CREATE POLICY "Admins can read sr_seasons"
ON public.sr_seasons FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can insert sr_seasons"
ON public.sr_seasons FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update sr_seasons"
ON public.sr_seasons FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can read sr_tournaments"
ON public.sr_tournaments FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can insert sr_tournaments"
ON public.sr_tournaments FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update sr_tournaments"
ON public.sr_tournaments FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can read sr_sync_log"
ON public.sr_sync_log FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can insert sr_sync_log"
ON public.sr_sync_log FOR INSERT
WITH CHECK (is_admin());