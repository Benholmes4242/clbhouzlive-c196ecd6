CREATE TABLE tour_season_rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES sr_players(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  tour_code TEXT NOT NULL,
  season_year INTEGER NOT NULL,
  position INTEGER NOT NULL,
  position_change TEXT,
  points NUMERIC,
  tournaments_played INTEGER,
  country TEXT,
  manual_player_id UUID REFERENCES sr_players(id),
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tour_code, season_year, player_name)
);

CREATE INDEX idx_tour_season_rankings_tour_year ON tour_season_rankings(tour_code, season_year);
CREATE INDEX idx_tour_season_rankings_player ON tour_season_rankings(player_id);
CREATE INDEX idx_tour_season_rankings_position ON tour_season_rankings(tour_code, season_year, position);

ALTER TABLE tour_season_rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON tour_season_rankings FOR SELECT USING (true);