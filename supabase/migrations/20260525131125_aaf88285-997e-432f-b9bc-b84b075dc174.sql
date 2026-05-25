-- Snapshot before bump
CREATE TABLE IF NOT EXISTS gam_user_badges_backup_tier_fix_2026_05_25 AS
SELECT * FROM gam_user_badges WHERE counter_tier IS NOT NULL;

-- Bump counter_tier by 1: switch from 0-indexed "highest index reached"
-- to 1-indexed "number of tiers reached".
UPDATE gam_user_badges
SET counter_tier = counter_tier + 1
WHERE counter_tier IS NOT NULL;