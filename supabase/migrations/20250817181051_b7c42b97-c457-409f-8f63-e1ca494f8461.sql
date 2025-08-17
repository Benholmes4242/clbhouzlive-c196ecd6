-- Fix security warning: Make check_profile_media_limit function secure
CREATE OR REPLACE FUNCTION check_profile_media_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM profile_media WHERE user_id = NEW.user_id AND is_immersive = true) >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 immersive media items allowed per user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;