
-- Add bag_visible column to user_profiles table to control visibility of "What's in the Bag" section
ALTER TABLE public.user_profiles 
ADD COLUMN bag_visible BOOLEAN DEFAULT true;

-- Update the updated_at timestamp when this column changes
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at_trigger') THEN
    CREATE TRIGGER update_user_profiles_updated_at_trigger
      BEFORE UPDATE ON public.user_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_user_profiles_updated_at();
  END IF;
END $$;
