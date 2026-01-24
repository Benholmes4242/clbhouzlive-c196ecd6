-- Sync division_config with Quest achievement system (TIER_CONFIG)
-- Clear existing incorrect divisions
DELETE FROM division_config;

-- Insert correct divisions matching src/lib/clbhouzAchievementPalette.ts TIER_CONFIG
INSERT INTO division_config (division_id, display_name, threshold, ring_color, sort_order)
VALUES
  ('rookie', 'Rookie Club', 5, '#7A6B5B', 1),
  ('fairway', 'Fairway Club', 10, '#8F866F', 2),
  ('founders', 'Founders Club', 20, '#A7A98A', 3),
  ('heritage', 'Heritage Club', 50, '#C1CFA1', 4),
  ('century', 'Century Club', 100, '#88B67B', 5),
  ('elite', 'Elite Club', 200, '#5B9E55', 6),
  ('legendary', 'Legendary Club', 300, '#3F7F41', 7),
  ('grandslam', 'Grand Slam Club', 400, '#D2B461', 8);