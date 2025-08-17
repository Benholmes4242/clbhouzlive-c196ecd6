-- Fix function search path security warnings by recreating functions with proper SECURITY DEFINER and search_path
DROP FUNCTION IF EXISTS public.update_profile_media_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_profile_media_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger since it was dropped with CASCADE
CREATE TRIGGER update_profile_media_updated_at
  BEFORE UPDATE ON public.profile_media
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_media_updated_at();

DROP FUNCTION IF EXISTS public.check_profile_media_limit() CASCADE;
CREATE OR REPLACE FUNCTION public.check_profile_media_limit()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Check if user already has 5 media items
    IF (
      SELECT COUNT(*) 
      FROM public.profile_media 
      WHERE user_id = NEW.user_id
    ) >= 5 THEN
      RAISE EXCEPTION 'Profile media limit of 5 items exceeded';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger since it was dropped with CASCADE  
CREATE TRIGGER check_profile_media_limit_trigger
  BEFORE INSERT ON public.profile_media
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_media_limit();

DROP FUNCTION IF EXISTS public.is_mobile_device();
CREATE OR REPLACE FUNCTION public.is_mobile_device()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This is a placeholder - actual mobile detection will be done client-side
  -- and passed to the edge function
  RETURN FALSE;
END;
$$;