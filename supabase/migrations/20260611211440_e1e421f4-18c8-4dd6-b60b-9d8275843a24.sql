CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  username_val TEXT;
  display_name_val TEXT;
  first_name_val TEXT;
  last_name_val TEXT;
  base_username TEXT;
  candidate TEXT;
  suffix INT;
  is_custom BOOLEAN := false;
  full_name_meta TEXT;
  email_local TEXT;
BEGIN
  -- Username (custom from metadata, else derived from email)
  IF NEW.raw_user_meta_data ->> 'username' IS NOT NULL THEN
    username_val := TRIM(NEW.raw_user_meta_data ->> 'username');
    is_custom := true;
  ELSE
    base_username := LOWER(REGEXP_REPLACE(
      SPLIT_PART(COALESCE(NEW.email, 'user'), '@', 1),
      '[^a-z0-9]', '', 'g'));
    IF LENGTH(base_username) < 3 THEN base_username := 'golfer'; END IF;
    base_username := LEFT(base_username, 12);
    candidate := base_username;
    suffix := 0;
    LOOP
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.user_profiles WHERE LOWER(username) = LOWER(candidate));
      suffix := suffix + 1;
      candidate := base_username || suffix::TEXT;
      IF suffix > 9999 THEN
        candidate := base_username || floor(random()*90000+10000)::TEXT;
        EXIT;
      END IF;
    END LOOP;
    username_val := candidate;
  END IF;

  -- Capture OAuth name fields (Apple supplies these only on FIRST auth)
  full_name_meta := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), '')
  );

  first_name_val := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'given_name'), '');
  last_name_val  := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'family_name'), '');

  -- Fallback: split full_name into first/last
  IF first_name_val IS NULL AND full_name_meta IS NOT NULL THEN
    first_name_val := NULLIF(TRIM(SPLIT_PART(full_name_meta, ' ', 1)), '');
  END IF;
  IF last_name_val IS NULL AND full_name_meta IS NOT NULL AND POSITION(' ' IN full_name_meta) > 0 THEN
    last_name_val := NULLIF(TRIM(SUBSTRING(full_name_meta FROM POSITION(' ' IN full_name_meta) + 1)), '');
  END IF;

  -- Display name: full_name → "First Last" → email local-part → "Golfer"
  email_local := NULLIF(TRIM(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1)), '');
  display_name_val := COALESCE(
    full_name_meta,
    NULLIF(TRIM(CONCAT_WS(' ', first_name_val, last_name_val)), ''),
    email_local,
    'Golfer'
  );

  INSERT INTO public.user_profiles (
    id, username, display_name, first_name, last_name,
    user_type, is_public, has_completed_onboarding, username_is_custom)
  VALUES (NEW.id, username_val, display_name_val, first_name_val, last_name_val,
    'individual', true, false, is_custom)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;