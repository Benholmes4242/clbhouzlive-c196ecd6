-- Update the exploration stats calculation function to use sub_country
-- USA is treated as one country, everything else uses sub_country for accurate nation counting
CREATE OR REPLACE FUNCTION update_exploration_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_countries text[];
  v_continents text[];
  v_country_count int;
  v_continent_count int;
BEGIN
  -- Determine which user to update
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
  ELSE
    v_user_id := NEW.user_id;
  END IF;

  -- Calculate countries using sub_country, but treat USA as one country
  SELECT 
    array_agg(DISTINCT 
      CASE 
        WHEN gc.country = 'USA' THEN 'USA'
        ELSE gc.sub_country
      END
    ),
    array_agg(DISTINCT gc.continent::text)
  INTO v_countries, v_continents
  FROM course_ratings cr
  JOIN golf_courses gc ON cr.course_id = gc.id
  WHERE cr.user_id = v_user_id
    AND (
      CASE 
        WHEN gc.country = 'USA' THEN 'USA'
        ELSE gc.sub_country
      END
    ) IS NOT NULL;

  -- Calculate counts
  v_country_count := COALESCE(array_length(v_countries, 1), 0);
  v_continent_count := COALESCE(array_length(v_continents, 1), 0);

  -- Upsert the stats
  INSERT INTO user_exploration_stats (
    user_id, 
    country_list, 
    countries_played, 
    continent_list, 
    continents_played, 
    updated_at
  )
  VALUES (
    v_user_id,
    COALESCE(v_countries, ARRAY[]::text[]),
    v_country_count,
    COALESCE(v_continents, ARRAY[]::text[]),
    v_continent_count,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    country_list = EXCLUDED.country_list,
    countries_played = EXCLUDED.countries_played,
    continent_list = EXCLUDED.continent_list,
    continents_played = EXCLUDED.continents_played,
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Recalculate exploration stats for ALL users with the new logic
DO $$
DECLARE
  r RECORD;
  v_countries text[];
  v_continents text[];
BEGIN
  FOR r IN SELECT DISTINCT user_id FROM course_ratings LOOP
    -- Calculate with new logic: sub_country except USA = 'USA'
    SELECT 
      array_agg(DISTINCT 
        CASE 
          WHEN gc.country = 'USA' THEN 'USA'
          ELSE gc.sub_country
        END
      ),
      array_agg(DISTINCT gc.continent::text)
    INTO v_countries, v_continents
    FROM course_ratings cr
    JOIN golf_courses gc ON cr.course_id = gc.id
    WHERE cr.user_id = r.user_id
      AND (
        CASE 
          WHEN gc.country = 'USA' THEN 'USA'
          ELSE gc.sub_country
        END
      ) IS NOT NULL;
    
    -- Update stats
    INSERT INTO user_exploration_stats (
      user_id, 
      country_list, 
      countries_played, 
      continent_list, 
      continents_played, 
      updated_at
    )
    VALUES (
      r.user_id,
      COALESCE(v_countries, ARRAY[]::text[]),
      COALESCE(array_length(v_countries, 1), 0),
      COALESCE(v_continents, ARRAY[]::text[]),
      COALESCE(array_length(v_continents, 1), 0),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      country_list = EXCLUDED.country_list,
      countries_played = EXCLUDED.countries_played,
      continent_list = EXCLUDED.continent_list,
      continents_played = EXCLUDED.continents_played,
      updated_at = NOW();
  END LOOP;
END $$;