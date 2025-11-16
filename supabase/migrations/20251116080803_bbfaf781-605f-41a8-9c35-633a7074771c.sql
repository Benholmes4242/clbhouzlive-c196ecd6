-- Add trigger to enforce Open to Play cannot be active when hidden
CREATE OR REPLACE FUNCTION check_open_to_play_visibility()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.open_to_play_active = true AND NEW.visibility_mode = 'hidden' THEN
    RAISE EXCEPTION 'Cannot be Open to Play while visibility is hidden';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_open_to_play_visibility
  BEFORE INSERT OR UPDATE ON user_nearby_status
  FOR EACH ROW
  EXECUTE FUNCTION check_open_to_play_visibility();