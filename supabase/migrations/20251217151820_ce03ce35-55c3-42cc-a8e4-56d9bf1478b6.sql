-- Backfill existing businesses into taggable_entities
INSERT INTO taggable_entities (entity_type, entity_id, name, username, profile_image_url)
SELECT 
  'business'::text as entity_type,
  id as entity_id,
  name,
  slug as username,
  logo_url as profile_image_url
FROM business_accounts
WHERE is_deleted = false
ON CONFLICT (entity_type, entity_id) DO UPDATE SET
  name = EXCLUDED.name,
  username = EXCLUDED.username,
  profile_image_url = EXCLUDED.profile_image_url,
  updated_at = now();

-- Create function to sync business_accounts to taggable_entities
CREATE OR REPLACE FUNCTION sync_business_to_taggable_entities()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.is_deleted = true) THEN
    -- Remove from taggable_entities when business is deleted
    DELETE FROM taggable_entities 
    WHERE entity_type = 'business' AND entity_id = COALESCE(OLD.id, NEW.id);
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Upsert into taggable_entities
  INSERT INTO taggable_entities (entity_type, entity_id, name, username, profile_image_url)
  VALUES (
    'business',
    NEW.id,
    NEW.name,
    NEW.slug,
    NEW.logo_url
  )
  ON CONFLICT (entity_type, entity_id) DO UPDATE SET
    name = EXCLUDED.name,
    username = EXCLUDED.username,
    profile_image_url = EXCLUDED.profile_image_url,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for business_accounts changes
DROP TRIGGER IF EXISTS sync_business_taggable_trigger ON business_accounts;
CREATE TRIGGER sync_business_taggable_trigger
  AFTER INSERT OR UPDATE OF name, slug, logo_url, is_deleted OR DELETE
  ON business_accounts
  FOR EACH ROW
  EXECUTE FUNCTION sync_business_to_taggable_entities();