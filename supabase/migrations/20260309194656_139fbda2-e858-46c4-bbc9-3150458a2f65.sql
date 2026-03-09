-- Migration 2: Location Columns
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS city    text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS country text DEFAULT '' NOT NULL;

COMMENT ON COLUMN user_profiles.city    IS 'User city of residence';
COMMENT ON COLUMN user_profiles.country IS 'User country of residence';