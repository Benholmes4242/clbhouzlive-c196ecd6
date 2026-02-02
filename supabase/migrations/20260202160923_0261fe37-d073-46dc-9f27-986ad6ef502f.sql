-- =============================================
-- AI PREDICTIONS TABLE
-- Stores pre-generated tournament predictions from Claude
-- =============================================

CREATE TABLE IF NOT EXISTS ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES sr_tournaments(id) ON DELETE CASCADE,
  
  -- Main prediction data
  predictions JSONB NOT NULL,           -- Array of top contenders
  dark_horses JSONB,                    -- Array of dark horse picks
  course_analysis JSONB,                -- Course fit analysis
  
  -- Metadata
  confidence DECIMAL(3,2),              -- Model confidence 0.00-1.00
  model_version TEXT NOT NULL,          -- e.g., 'claude-sonnet-4-20250514'
  prompt_version TEXT DEFAULT 'v1',     -- Track prompt iterations
  
  -- Research context (optional, for Perplexity integration later)
  research_context JSONB,               -- External research data used
  
  -- Timestamps
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,  -- When to regenerate
  
  -- Ensure one prediction per tournament
  UNIQUE(tournament_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_predictions_tournament ON ai_predictions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_generated ON ai_predictions(generated_at DESC);

-- Enable RLS
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read predictions
CREATE POLICY "Public read access" ON ai_predictions
  FOR SELECT USING (true);

-- Policy: Only service role can insert/update (edge functions use service role)
CREATE POLICY "Service role write access" ON ai_predictions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role update access" ON ai_predictions
  FOR UPDATE USING (true);

-- =============================================
-- PLAYER COURSE HISTORY TABLE
-- Tracks player performance at specific venues (for future enhancement)
-- =============================================

CREATE TABLE IF NOT EXISTS player_course_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES sr_players(id) ON DELETE CASCADE,
  venue_name TEXT NOT NULL,
  tournament_id UUID REFERENCES sr_tournaments(id),
  
  -- Performance data
  finish_position INTEGER,
  score_to_par INTEGER,
  rounds_played INTEGER DEFAULT 4,
  made_cut BOOLEAN DEFAULT true,
  
  -- Stats at this venue
  sg_total DECIMAL(4,2),
  driving_accuracy DECIMAL(5,2),
  greens_in_regulation DECIMAL(5,2),
  
  -- Timestamp
  played_at TIMESTAMP WITH TIME ZONE,
  
  -- Prevent duplicates
  UNIQUE(player_id, tournament_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_player_course_venue ON player_course_history(player_id, venue_name);
CREATE INDEX IF NOT EXISTS idx_player_course_player ON player_course_history(player_id);

-- Enable RLS
ALTER TABLE player_course_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for course history" ON player_course_history
  FOR SELECT USING (true);

-- =============================================
-- PREDICTION AUDIT LOG
-- Track prediction accuracy over time
-- =============================================

CREATE TABLE IF NOT EXISTS prediction_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES sr_tournaments(id),
  prediction_id UUID REFERENCES ai_predictions(id),
  
  -- What we predicted
  predicted_winner_id UUID REFERENCES sr_players(id),
  predicted_top_5 UUID[],               -- Array of player IDs
  predicted_dark_horses UUID[],
  
  -- Actual results (filled in after tournament)
  actual_winner_id UUID REFERENCES sr_players(id),
  actual_top_5 UUID[],
  
  -- Accuracy metrics
  winner_correct BOOLEAN,
  top_5_hits INTEGER,                   -- How many of our top 5 finished top 5
  dark_horse_hits INTEGER,              -- How many dark horses made top 20
  
  -- Timestamps
  predicted_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(tournament_id)
);

-- Enable RLS
ALTER TABLE prediction_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for audit log" ON prediction_audit_log
  FOR SELECT USING (true);