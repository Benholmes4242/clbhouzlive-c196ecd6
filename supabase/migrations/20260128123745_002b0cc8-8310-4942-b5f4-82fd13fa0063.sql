-- Drop existing unique constraint on username (case-sensitive)
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_username_key;

-- Drop any existing lowercase index
DROP INDEX IF EXISTS user_profiles_username_unique_lower;

-- Create a unique index on lowercase username for case-insensitive uniqueness
-- This allows "GolfPro" to be stored as-is, but prevents "golfpro" from being registered
CREATE UNIQUE INDEX user_profiles_username_unique_lower 
ON user_profiles (LOWER(username))
WHERE username IS NOT NULL;