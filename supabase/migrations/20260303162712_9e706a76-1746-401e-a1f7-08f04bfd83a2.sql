
-- Sync auth email to admin_profiles (and coaches table which has user_id)
-- coach_profiles has no user_id column so cannot be synced this way

CREATE OR REPLACE FUNCTION public.sync_user_email(user_id_param UUID, current_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE admin_profiles SET email = current_email, updated_at = now()
    WHERE user_id = user_id_param::text AND email != current_email;
END;
$$;
