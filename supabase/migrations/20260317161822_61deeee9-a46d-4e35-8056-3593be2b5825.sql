
-- Update the user sync function to store name as PascalCase no-space format
-- e.g. "Andrew Yetzes" → "AndrewYetzes"
CREATE OR REPLACE FUNCTION public.sync_user_to_taggable_entities()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pascal_name text;
  raw_name text;
  word text;
BEGIN
  CASE NEW.user_type
    WHEN 'individual' THEN
      -- Build PascalCase no-space name from display_name or username
      raw_name := COALESCE(NEW.display_name, NEW.username, 'User');
      pascal_name := '';
      FOREACH word IN ARRAY string_to_array(raw_name, ' ')
      LOOP
        IF word <> '' THEN
          pascal_name := pascal_name || upper(left(word, 1)) || substring(word from 2);
        END IF;
      END LOOP;
      IF pascal_name = '' THEN
        pascal_name := raw_name;
      END IF;

      INSERT INTO public.taggable_entities (entity_type, entity_id, name, username, profile_image_url)
      VALUES (
        'user'::text,
        NEW.id,
        pascal_name,
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

-- Backfill existing user taggable_entities to PascalCase no-space format
UPDATE public.taggable_entities te
SET name = (
  SELECT string_agg(upper(left(word, 1)) || substring(word from 2), '')
  FROM unnest(string_to_array(te.name, ' ')) AS word
  WHERE word <> ''
),
updated_at = now()
WHERE te.entity_type = 'user'
AND te.name ~ ' ';
