-- Fix search_path for the function we just created
CREATE OR REPLACE FUNCTION update_user_nearby_status_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;