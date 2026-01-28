-- Add fields to track creator onboarding state
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS creator_enabled_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS has_seen_creator_welcome boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.creator_enabled_at IS 'Timestamp when user first enabled Creator Mode';
COMMENT ON COLUMN user_profiles.has_seen_creator_welcome IS 'Whether user has seen and dismissed the Creator Mode welcome overlay';

-- Backfill: Set creator_enabled_at for existing creators
UPDATE user_profiles 
SET creator_enabled_at = updated_at 
WHERE is_creator = true AND creator_enabled_at IS NULL;