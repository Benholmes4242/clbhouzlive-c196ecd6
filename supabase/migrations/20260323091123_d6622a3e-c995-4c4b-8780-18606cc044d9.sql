-- Clean up user_profiles for accounts created more than 7 days ago
-- whose auth.users email_confirmed_at is still NULL (never verified)
CREATE OR REPLACE FUNCTION public.cleanup_unverified_profiles()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_profiles
  WHERE id IN (
    SELECT up.id
    FROM public.user_profiles up
    JOIN auth.users au ON au.id = up.id
    WHERE au.email_confirmed_at IS NULL
      AND au.created_at < now() - interval '7 days'
  );
END;
$$;

SELECT cron.schedule(
  'cleanup-unverified-profiles',
  '0 3 * * *',
  'SELECT public.cleanup_unverified_profiles()'
);