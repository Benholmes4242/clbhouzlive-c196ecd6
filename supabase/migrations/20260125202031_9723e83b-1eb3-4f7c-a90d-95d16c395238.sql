-- Phase 1.1: Add continents tracking to user_exploration_stats

-- Add continents tracking columns
ALTER TABLE user_exploration_stats
ADD COLUMN IF NOT EXISTS continents_played integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS continent_list text[] DEFAULT '{}';

-- Create index for performance on continents
CREATE INDEX IF NOT EXISTS idx_user_exploration_stats_continents 
ON user_exploration_stats(continents_played DESC);

-- Backfill existing data from course_ratings by joining with golf_courses
UPDATE user_exploration_stats ues
SET 
  continents_played = subq.continent_count,
  continent_list = subq.continents
FROM (
  SELECT 
    cr.user_id,
    COUNT(DISTINCT gc.continent) as continent_count,
    ARRAY_AGG(DISTINCT gc.continent::text) FILTER (WHERE gc.continent IS NOT NULL) as continents
  FROM course_ratings cr
  JOIN golf_courses gc ON cr.course_id = gc.id
  WHERE gc.continent IS NOT NULL
  GROUP BY cr.user_id
) subq
WHERE ues.user_id = subq.user_id;

-- Update the trigger function to also track continents when course ratings change
CREATE OR REPLACE FUNCTION update_exploration_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_country text;
  v_continent text;
  v_region text;
BEGIN
  -- Get the user_id based on trigger operation
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
  ELSE
    v_user_id := NEW.user_id;
  END IF;
  
  -- Recalculate all exploration stats for this user
  INSERT INTO user_exploration_stats (
    user_id,
    countries_played,
    country_list,
    continents_played,
    continent_list,
    regions_completed,
    region_list,
    updated_at
  )
  SELECT 
    v_user_id,
    COUNT(DISTINCT gc.country),
    ARRAY_AGG(DISTINCT gc.country) FILTER (WHERE gc.country IS NOT NULL),
    COUNT(DISTINCT gc.continent),
    ARRAY_AGG(DISTINCT gc.continent::text) FILTER (WHERE gc.continent IS NOT NULL),
    0, -- regions_completed calculated separately
    '{}', -- region_list calculated separately
    now()
  FROM course_ratings cr
  JOIN golf_courses gc ON cr.course_id = gc.id
  WHERE cr.user_id = v_user_id
  ON CONFLICT (user_id) DO UPDATE SET
    countries_played = EXCLUDED.countries_played,
    country_list = EXCLUDED.country_list,
    continents_played = EXCLUDED.continents_played,
    continent_list = EXCLUDED.continent_list,
    updated_at = now(),
    last_country_added_at = CASE 
      WHEN EXCLUDED.countries_played > user_exploration_stats.countries_played 
      THEN now() 
      ELSE user_exploration_stats.last_country_added_at 
    END;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;