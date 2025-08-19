-- Fix security issue: Add search_path to the caddie logs trigger function
CREATE OR REPLACE FUNCTION public.update_caddie_logs_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;