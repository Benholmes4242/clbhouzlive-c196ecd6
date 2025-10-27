-- Add user visibility and location tracking for nearby feature
CREATE TABLE IF NOT EXISTS public.user_nearby_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visible_nearby BOOLEAN NOT NULL DEFAULT false,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  last_location_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_nearby_status ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own status
CREATE POLICY "Users can view their own nearby status"
  ON public.user_nearby_status
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own status
CREATE POLICY "Users can insert their own nearby status"
  ON public.user_nearby_status
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own status
CREATE POLICY "Users can update their own nearby status"
  ON public.user_nearby_status
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can view nearby status of visible users
CREATE POLICY "Users can view visible nearby users"
  ON public.user_nearby_status
  FOR SELECT
  USING (visible_nearby = true);

-- Create index for location queries
CREATE INDEX idx_user_nearby_visible ON public.user_nearby_status(visible_nearby) WHERE visible_nearby = true;
CREATE INDEX idx_user_nearby_location ON public.user_nearby_status(lat, lng) WHERE visible_nearby = true;

-- Add trigger for updated_at
CREATE TRIGGER update_user_nearby_status_updated_at
  BEFORE UPDATE ON public.user_nearby_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();