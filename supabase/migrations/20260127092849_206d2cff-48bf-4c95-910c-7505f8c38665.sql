-- Drop the legacy 6-parameter version of get_exploration_leaderboard without p_metric
-- This version returns continents_count: 0 for all users because it doesn't use user_exploration_stats
DROP FUNCTION IF EXISTS get_exploration_leaderboard(text, uuid, uuid, integer, integer, text);