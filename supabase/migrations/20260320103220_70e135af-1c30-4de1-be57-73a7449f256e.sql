
-- Drop stale get_countries_leaderboard (old arg order)
DROP FUNCTION IF EXISTS public.get_countries_leaderboard(text, integer, integer, uuid);

-- Drop stale get_exploration_leaderboard (6-arg version)
DROP FUNCTION IF EXISTS public.get_exploration_leaderboard(text, text, uuid, integer, integer, uuid);

-- Drop stale get_exploration_leaderboard (7-arg old version without privacy filter)
DROP FUNCTION IF EXISTS public.get_exploration_leaderboard(text, text, uuid, integer, integer, uuid, text);

-- Drop stale get_handicap_improvement_leaderboard overloads without privacy filter
DROP FUNCTION IF EXISTS public.get_handicap_improvement_leaderboard(text, text, text, integer, integer, uuid);
DROP FUNCTION IF EXISTS public.get_handicap_improvement_leaderboard(text, uuid, integer, integer, uuid, text);

-- Drop stale get_lowest_handicap_leaderboard without privacy filter
DROP FUNCTION IF EXISTS public.get_lowest_handicap_leaderboard(text, uuid, integer, integer, uuid, text);

-- Drop stale get_season_improvement_leaderboard overloads without privacy filter
DROP FUNCTION IF EXISTS public.get_season_improvement_leaderboard(text, text, text, integer, integer, uuid);
DROP FUNCTION IF EXISTS public.get_season_improvement_leaderboard(text, uuid, integer, integer, uuid, text);
