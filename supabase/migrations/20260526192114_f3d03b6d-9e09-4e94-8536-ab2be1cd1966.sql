UPDATE gam_badge_catalogue SET counter_tiers = '[1, 50, 200, 500, 1000]'::jsonb WHERE id = 'first_birdie';
UPDATE gam_badge_catalogue SET counter_tiers = '[1, 5, 10, 50, 100]'::jsonb WHERE id = 'first_eagle';
UPDATE gam_badge_catalogue SET counter_tiers = '[1, 2, 5, 10, 20]'::jsonb WHERE id = 'first_albatross';
UPDATE gam_badge_catalogue SET counter_tiers = '[1, 3, 5, 10, 20]'::jsonb WHERE id = 'hole_in_one';
UPDATE gam_badge_catalogue SET counter_tiers = '[1, 10, 25, 50, 100]'::jsonb WHERE id IN ('top_100_worldwide','top_100_usa','top_100_gbni','top_100_europe');

UPDATE gam_user_badges
SET counter_tier = (
  SELECT COUNT(*)::int
  FROM jsonb_array_elements_text(gbc.counter_tiers) AS t(threshold)
  WHERE COALESCE(gam_user_badges.counter_value, 0) >= (t.threshold)::int
)
FROM gam_badge_catalogue gbc
WHERE gbc.id = gam_user_badges.badge_id
  AND gam_user_badges.badge_id IN ('first_birdie','first_eagle','first_albatross','hole_in_one',
                                   'top_100_worldwide','top_100_usa','top_100_gbni','top_100_europe');