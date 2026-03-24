ALTER TABLE championship_seasons
ADD COLUMN season_winner_user_id uuid,
ADD COLUMN season_winner_courses integer,
ADD COLUMN prize_claimed boolean DEFAULT false;