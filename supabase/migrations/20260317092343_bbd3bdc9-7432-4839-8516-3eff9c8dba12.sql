CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  username_val     TEXT;
  display_name_val TEXT;
  base_username    TEXT;
  candidate        TEXT;
  suffix           INT;
BEGIN
  -- Email sign-ups pass username explicitly in metadata — use it directly
  IF NEW.raw_user_meta_data ->> 'username' IS NOT NULL THEN
    username_val := TRIM(NEW.raw_user_meta_data ->> 'username');

  -- OAuth sign-ups (Apple, Google) — generate a collision-safe username
  ELSE
    -- Start from the email prefix, strip non-alphanumeric chars, lowercase
    base_username := LOWER(REGEXP_REPLACE(
      SPLIT_PART(COALESCE(NEW.email, 'user'), '@', 1),
      '[^a-z0-9]', '', 'g'
    ));

    -- Ensure minimum length
    IF LENGTH(base_username) < 3 THEN
      base_username := 'golfer';
    END IF;

    -- Truncate to leave room for suffix
    base_username := LEFT(base_username, 12);

    -- Find a unique username by appending a numeric suffix
    candidate := base_username;
    suffix := 0;
    LOOP
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE LOWER(username) = LOWER(candidate)
      );
      suffix := suffix + 1;
      candidate := base_username || suffix::TEXT;
      -- Safety valve: after 9999 attempts use random suffix
      IF suffix > 9999 THEN
        candidate := base_username || floor(random() * 90000 + 10000)::TEXT;
        EXIT;
      END IF;
    END LOOP;

    username_val := candidate;
  END IF;

  -- Display name: prefer full_name > name from metadata, else use username
  display_name_val := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''),
    username_val
  );

  INSERT INTO public.user_profiles (
    id, username, display_name, user_type, is_public,
    has_completed_onboarding
  )
  VALUES (
    NEW.id, username_val, display_name_val,
    'individual', true, false
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;