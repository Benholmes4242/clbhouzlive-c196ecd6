-- Create function to rotate championship seasons
CREATE OR REPLACE FUNCTION rotate_championship_seasons()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ended_season RECORD;
  v_next_season RECORD;
BEGIN
  -- Find any active season that has ended
  SELECT * INTO v_ended_season
  FROM championship_seasons
  WHERE status = 'active'
    AND end_date < CURRENT_DATE;

  IF v_ended_season IS NOT NULL THEN
    -- Archive the podium before closing the season
    PERFORM archive_season_podium(v_ended_season.id);
    
    -- Mark the season as completed
    UPDATE championship_seasons
    SET status = 'completed'
    WHERE id = v_ended_season.id;
    
    RAISE NOTICE 'Season % completed', v_ended_season.name;
  END IF;

  -- Check if we need to activate a new season
  IF NOT EXISTS (SELECT 1 FROM championship_seasons WHERE status = 'active') THEN
    -- Find the next upcoming season that should start
    SELECT * INTO v_next_season
    FROM championship_seasons
    WHERE status = 'upcoming'
      AND start_date <= CURRENT_DATE
    ORDER BY start_date ASC
    LIMIT 1;

    IF v_next_season IS NOT NULL THEN
      -- Activate the new season
      UPDATE championship_seasons
      SET status = 'active'
      WHERE id = v_next_season.id;
      
      RAISE NOTICE 'Season % activated', v_next_season.name;
    END IF;
  END IF;
END;
$$;