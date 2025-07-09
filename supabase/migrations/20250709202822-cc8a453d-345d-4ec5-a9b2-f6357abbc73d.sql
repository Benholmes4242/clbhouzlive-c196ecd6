-- Fix the golf course sync function to bypass RLS
CREATE OR REPLACE FUNCTION public.sync_golf_course_to_taggable_entities()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER  -- This allows the function to bypass RLS
AS $$
BEGIN
  INSERT INTO public.taggable_entities (entity_type, entity_id, name, username, profile_image_url)
  VALUES (
    'golf_club'::text,
    NEW.id,
    NEW.name,
    NULL,
    NEW.thumbnail_image
  )
  ON CONFLICT (entity_type, entity_id) DO UPDATE SET
    name = EXCLUDED.name,
    profile_image_url = EXCLUDED.profile_image_url,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Also fix the user sync function to be consistent
CREATE OR REPLACE FUNCTION public.sync_user_to_taggable_entities()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER  -- This allows the function to bypass RLS
AS $$
BEGIN
  -- Determine entity type based on user_type
  CASE NEW.user_type
    WHEN 'individual' THEN
      INSERT INTO public.taggable_entities (entity_type, entity_id, name, username, profile_image_url)
      VALUES (
        'user'::text,
        NEW.id,
        COALESCE(NEW.display_name, NEW.username, 'User'),
        NEW.username,
        NEW.profile_photo_url
      )
      ON CONFLICT (entity_type, entity_id) DO UPDATE SET
        name = EXCLUDED.name,
        username = EXCLUDED.username,
        profile_image_url = EXCLUDED.profile_image_url,
        updated_at = now();
    ELSE
      INSERT INTO public.taggable_entities (entity_type, entity_id, name, username, profile_image_url)
      VALUES (
        'business'::text,
        NEW.id,
        COALESCE(NEW.business_name, NEW.display_name, NEW.username, 'Business'),
        NEW.username,
        COALESCE(NEW.logo_url, NEW.profile_photo_url)
      )
      ON CONFLICT (entity_type, entity_id) DO UPDATE SET
        name = EXCLUDED.name,
        username = EXCLUDED.username,
        profile_image_url = EXCLUDED.profile_image_url,
        updated_at = now();
  END CASE;

  RETURN NEW;
END;
$$;