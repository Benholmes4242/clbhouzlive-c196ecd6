-- Create function to calculate correct division based on courses_logged
CREATE OR REPLACE FUNCTION public.calculate_user_division(p_courses_logged integer)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_division_id text;
BEGIN
  SELECT division_id INTO v_division_id
  FROM division_config
  WHERE threshold <= p_courses_logged
  ORDER BY threshold DESC
  LIMIT 1;
  
  RETURN COALESCE(v_division_id, 'rookie');
END;
$$;

-- Create trigger function to auto-update current_division
CREATE OR REPLACE FUNCTION public.trigger_update_user_division()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Calculate and set the correct division based on courses_logged
  NEW.current_division := public.calculate_user_division(NEW.courses_logged);
  RETURN NEW;
END;
$$;

-- Create trigger on user_season_stats
DROP TRIGGER IF EXISTS trigger_auto_update_division ON public.user_season_stats;
CREATE TRIGGER trigger_auto_update_division
  BEFORE INSERT OR UPDATE OF courses_logged ON public.user_season_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_user_division();

-- Fix existing misassigned divisions (one-time correction)
UPDATE public.user_season_stats
SET current_division = public.calculate_user_division(courses_logged)
WHERE current_division != public.calculate_user_division(courses_logged);