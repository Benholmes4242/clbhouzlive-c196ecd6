-- ============================================================================
-- SportRadar API Integration - Schema Enhancements
-- Adds new columns per the Integration Map documentation
-- ============================================================================

-- 1. sr_tournaments (16 new columns)
ALTER TABLE sr_tournaments ADD COLUMN IF NOT EXISTS points INTEGER;
ALTER TABLE sr_tournaments ADD COLUMN IF NOT EXISTS winning_share DECIMAL(12,2);
ALTER TABLE sr_tournaments ADD COLUMN IF NOT EXISTS parent_id UUID;
ALTER TABLE sr_tournaments ADD COLUMN IF NOT EXISTS event_type VARCHAR(20);
ALTER TABLE sr_tournaments ADD COLUMN IF NOT EXISTS scoring_system VARCHAR(20);
ALTER TABLE sr_tournaments ADD COLUMN IF NOT EXISTS network VARCHAR(100);
ALTER TABLE sr_tournaments ADD COLUMN IF NOT EXISTS coverage VARCHAR(20);
ALTER TABLE sr_tournaments ADD COLUMN IF NOT EXISTS course_timezone VARCHAR(50);
ALTER TABLE sr_tournaments ADD COLUMN IF NOT EXISTS cut_round INTEGER;
ALTER TABLE sr_tournaments ADD COLUMN IF NOT EXISTS cutline INTEGER;
ALTER TABLE sr_tournaments ADD COLUMN IF NOT EXISTS projected_cutline INTEGER;
ALTER TABLE sr_tournaments ADD COLUMN IF NOT EXISTS venue_id UUID;
ALTER TABLE sr_tournaments ADD COLUMN IF NOT EXISTS venue_zipcode VARCHAR(20);
ALTER TABLE sr_tournaments ADD COLUMN IF NOT EXISTS venue_latitude VARCHAR(50);
ALTER TABLE sr_tournaments ADD COLUMN IF NOT EXISTS venue_longitude VARCHAR(50);
ALTER TABLE sr_tournaments ADD COLUMN IF NOT EXISTS winner_id UUID;

-- 2. sr_players (5 new columns)
ALTER TABLE sr_players ADD COLUMN IF NOT EXISTS abbr_name VARCHAR(50);
ALTER TABLE sr_players ADD COLUMN IF NOT EXISTS handedness CHAR(1);
ALTER TABLE sr_players ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
ALTER TABLE sr_players ADD COLUMN IF NOT EXISTS is_amateur BOOLEAN DEFAULT FALSE;
ALTER TABLE sr_players ADD COLUMN IF NOT EXISTS is_member BOOLEAN DEFAULT FALSE;

-- 3. sr_player_statistics (9 new columns)
ALTER TABLE sr_player_statistics ADD COLUMN IF NOT EXISTS cuts_missed INTEGER;
ALTER TABLE sr_player_statistics ADD COLUMN IF NOT EXISTS second_place INTEGER;
ALTER TABLE sr_player_statistics ADD COLUMN IF NOT EXISTS third_place INTEGER;
ALTER TABLE sr_player_statistics ADD COLUMN IF NOT EXISTS withdrawals INTEGER;
ALTER TABLE sr_player_statistics ADD COLUMN IF NOT EXISTS holes_per_eagle DECIMAL(6,2);
ALTER TABLE sr_player_statistics ADD COLUMN IF NOT EXISTS holes_proximity_avg VARCHAR(20);
ALTER TABLE sr_player_statistics ADD COLUMN IF NOT EXISTS strokes_gained_putting DECIMAL(6,3);
ALTER TABLE sr_player_statistics ADD COLUMN IF NOT EXISTS strokes_gained_tee_green DECIMAL(6,3);
ALTER TABLE sr_player_statistics ADD COLUMN IF NOT EXISTS total_driving INTEGER;

-- 4. sr_leaderboards (3 new columns)
ALTER TABLE sr_leaderboards ADD COLUMN IF NOT EXISTS starting_score INTEGER;
ALTER TABLE sr_leaderboards ADD COLUMN IF NOT EXISTS wins INTEGER;
ALTER TABLE sr_leaderboards ADD COLUMN IF NOT EXISTS losses INTEGER;

-- 5. sr_world_rankings (5 new columns - some already exist)
ALTER TABLE sr_world_rankings ADD COLUMN IF NOT EXISTS prior_rank INTEGER;
ALTER TABLE sr_world_rankings ADD COLUMN IF NOT EXISTS tied BOOLEAN DEFAULT FALSE;
ALTER TABLE sr_world_rankings ADD COLUMN IF NOT EXISTS avg_points DECIMAL(8,4);
ALTER TABLE sr_world_rankings ADD COLUMN IF NOT EXISTS ranking_id UUID;
ALTER TABLE sr_world_rankings ADD COLUMN IF NOT EXISTS ranking_status VARCHAR(20);

-- 6. sr_tee_times (2 new columns)
ALTER TABLE sr_tee_times ADD COLUMN IF NOT EXISTS pairing_id UUID;
ALTER TABLE sr_tee_times ADD COLUMN IF NOT EXISTS back_nine BOOLEAN DEFAULT FALSE;

-- 7. sr_scorecards (3 new columns)
ALTER TABLE sr_scorecards ADD COLUMN IF NOT EXISTS starting_hole INTEGER;
ALTER TABLE sr_scorecards ADD COLUMN IF NOT EXISTS birdies INTEGER;
ALTER TABLE sr_scorecards ADD COLUMN IF NOT EXISTS bogeys INTEGER;
ALTER TABLE sr_scorecards ADD COLUMN IF NOT EXISTS eagles INTEGER;
ALTER TABLE sr_scorecards ADD COLUMN IF NOT EXISTS pars INTEGER;
ALTER TABLE sr_scorecards ADD COLUMN IF NOT EXISTS double_bogeys INTEGER;
ALTER TABLE sr_scorecards ADD COLUMN IF NOT EXISTS holes_in_one INTEGER;
ALTER TABLE sr_scorecards ADD COLUMN IF NOT EXISTS other_scores INTEGER;
ALTER TABLE sr_scorecards ADD COLUMN IF NOT EXISTS thru INTEGER;
ALTER TABLE sr_scorecards ADD COLUMN IF NOT EXISTS round_score INTEGER;
ALTER TABLE sr_scorecards ADD COLUMN IF NOT EXISTS round_strokes INTEGER;

-- 8. sr_hole_statistics (1 new column)
ALTER TABLE sr_hole_statistics ADD COLUMN IF NOT EXISTS avg_diff DECIMAL(5,3);

-- 9. sr_seasons (4 new columns)
ALTER TABLE sr_seasons ADD COLUMN IF NOT EXISTS tour_full_name VARCHAR(100);
ALTER TABLE sr_seasons ADD COLUMN IF NOT EXISTS status VARCHAR(20);
ALTER TABLE sr_seasons ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE sr_seasons ADD COLUMN IF NOT EXISTS end_date DATE;

-- 10. sr_tournament_summaries - add more fields for weather/broadcast
ALTER TABLE sr_tournament_summaries ADD COLUMN IF NOT EXISTS wind_speed VARCHAR(20);
ALTER TABLE sr_tournament_summaries ADD COLUMN IF NOT EXISTS wind_direction VARCHAR(10);
ALTER TABLE sr_tournament_summaries ADD COLUMN IF NOT EXISTS temperature VARCHAR(20);
ALTER TABLE sr_tournament_summaries ADD COLUMN IF NOT EXISTS broadcast_network VARCHAR(100);
ALTER TABLE sr_tournament_summaries ADD COLUMN IF NOT EXISTS broadcast_cable VARCHAR(100);
ALTER TABLE sr_tournament_summaries ADD COLUMN IF NOT EXISTS broadcast_internet VARCHAR(100);