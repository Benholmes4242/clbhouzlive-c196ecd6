-- Add indexes for efficient game queries
CREATE INDEX IF NOT EXISTS idx_games_host ON public.games(host_user_id);
CREATE INDEX IF NOT EXISTS idx_games_visibility_start ON public.games(visibility, start_time);