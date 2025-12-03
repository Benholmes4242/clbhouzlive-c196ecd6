-- MODULE 1: Weekly Highlights table
CREATE TABLE public.leaderboard_highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'big_jump', 'lost_rank', 'new_region_top10', 'most_active'
  value INTEGER DEFAULT 0,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

-- RLS for highlights
ALTER TABLE public.leaderboard_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view highlights"
ON public.leaderboard_highlights
FOR SELECT
USING (true);

-- Index for efficient querying
CREATE INDEX idx_leaderboard_highlights_user ON public.leaderboard_highlights(user_id);
CREATE INDEX idx_leaderboard_highlights_type ON public.leaderboard_highlights(type);
CREATE INDEX idx_leaderboard_highlights_expires ON public.leaderboard_highlights(expires_at);

-- MODULE 2: Add activity badges columns to user_profiles  
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS recent_activity_badges JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS last_rating_at TIMESTAMP WITH TIME ZONE;