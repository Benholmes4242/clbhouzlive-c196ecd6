-- Fix THE PLAYERS Championship - Cameron Young
-- Correct 4-round totals from sr_leaderboards.raw_data.rounds
UPDATE tournament_result_meta
SET
  stat_birdies = 20,
  stat_pars = 46,
  stat_bogeys = 5,
  stat_eagles = 0
WHERE tournament_id = 'e2cf7209-4463-4f5f-87f6-edd2f71dc474';

-- Fix LIV Golf Singapore - Bryson DeChambeau
-- Correct 4-round totals from sr_leaderboards.raw_data.rounds
UPDATE tournament_result_meta
SET
  stat_birdies = 18,
  stat_pars = 45,
  stat_bogeys = 6,
  stat_eagles = 2
WHERE tournament_id = 'ea8f8af5-2b35-41d3-a1f7-e0da1d250d54';