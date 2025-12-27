-- Add is_public column to user_profiles with DEFAULT TRUE
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE NOT NULL;

-- Ensure show_handicap has DEFAULT TRUE and NOT NULL
ALTER TABLE user_profiles 
ALTER COLUMN show_handicap SET DEFAULT TRUE;

ALTER TABLE user_profiles 
ALTER COLUMN show_handicap SET NOT NULL;

-- Backfill: set any NULL is_public → TRUE (shouldn't be needed with NOT NULL but for safety)
UPDATE user_profiles SET is_public = TRUE WHERE is_public IS NULL;

-- Backfill: set any NULL show_handicap → TRUE
UPDATE user_profiles SET show_handicap = TRUE WHERE show_handicap IS NULL;