-- Create execute_sql function for backward compatibility until types are updated
CREATE OR REPLACE FUNCTION public.execute_sql(query TEXT, params JSON DEFAULT '[]'::JSON)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  -- This is a simplified version - in production you'd want proper parameter binding
  -- For now, we'll handle the specific badge pin queries
  
  IF query LIKE '%SELECT COUNT(*) as count FROM user_badge_pins%' THEN
    EXECUTE format('SELECT json_agg(json_build_object(''count'', count)) FROM (SELECT COUNT(*) as count FROM user_badge_pins WHERE user_id = %L) t', params->0) INTO result;
    RETURN result;
  END IF;
  
  IF query LIKE '%INSERT INTO user_badge_pins%' THEN
    EXECUTE format('INSERT INTO user_badge_pins (user_id, badge_id, pinned_at) VALUES (%L, %L, %L)', params->0, params->1, params->2);
    RETURN '[]'::JSON;
  END IF;
  
  RETURN '[]'::JSON;
END;
$$;