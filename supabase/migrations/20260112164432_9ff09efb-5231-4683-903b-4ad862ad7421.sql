-- Fix posting regression: missing function used by badge trigger chain
-- createPost INSERT on posts fires trigger_badge_check() -> check_and_award_badges() -> log_user_achievement()
-- log_user_achievement() is missing, causing the insert to fail.

CREATE OR REPLACE FUNCTION public.log_user_achievement(
  p_user_id uuid,
  p_event text,
  p_metadata jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Lightweight audit trail for achievements/badges.
  -- We log into analytics_events (existing table) so failures don't block core posting.
  BEGIN
    INSERT INTO public.analytics_events (name, props, user_id)
    VALUES (
      'user_achievement:' || COALESCE(p_event, 'unknown'),
      COALESCE(p_metadata, '{}'::jsonb),
      p_user_id
    );
  EXCEPTION
    WHEN undefined_table THEN
      -- If analytics_events isn't present for some reason, don't block posting.
      NULL;
    WHEN others THEN
      -- Never let achievement logging break posting.
      NULL;
  END;
END;
$$;