-- Add duration field to profile_media for video/photo timing
ALTER TABLE profile_media 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 3000, -- Duration in milliseconds, default 3s for photos
ADD COLUMN IF NOT EXISTS video_method TEXT DEFAULT 'upload', -- 'upload' or 'ai_generated'  
ADD COLUMN IF NOT EXISTS is_immersive BOOLEAN DEFAULT true; -- Whether this media is part of immersive experience

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profile_media_user_order ON profile_media(user_id, display_order);
CREATE INDEX IF NOT EXISTS idx_profile_media_user_immersive ON profile_media(user_id, is_immersive, display_order);

-- Add constraint to limit media items per user to 5
CREATE OR REPLACE FUNCTION check_profile_media_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM profile_media WHERE user_id = NEW.user_id AND is_immersive = true) >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 immersive media items allowed per user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for the limit check
DROP TRIGGER IF EXISTS profile_media_limit_trigger ON profile_media;
CREATE TRIGGER profile_media_limit_trigger
  BEFORE INSERT ON profile_media
  FOR EACH ROW
  EXECUTE FUNCTION check_profile_media_limit();

-- Migrate existing profile videos to profile_media table
INSERT INTO profile_media (user_id, media_type, media_url, thumbnail_url, display_order, is_immersive, duration, video_method)
SELECT 
  id as user_id,
  'video' as media_type,
  profile_video_url as media_url,
  profile_video_thumbnail_url as thumbnail_url,
  0 as display_order,
  true as is_immersive,
  10000 as duration, -- Default 10s for existing videos
  'upload' as video_method
FROM user_profiles 
WHERE profile_video_url IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM profile_media 
  WHERE user_id = user_profiles.id 
  AND media_url = user_profiles.profile_video_url
);

-- Add telemetry table for tracking immersive profile events
CREATE TABLE IF NOT EXISTS profile_immersive_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  viewer_id UUID,
  event_type TEXT NOT NULL, -- 'entered', 'exited', 'swipe_return', 'media_change', 'video_play', 'video_pause', 'video_unmute'
  media_index INTEGER,
  session_id TEXT,
  device_type TEXT,
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on telemetry table
ALTER TABLE profile_immersive_telemetry ENABLE ROW LEVEL SECURITY;

-- Create policy for telemetry (users can create their own telemetry, view their profile's telemetry)
CREATE POLICY "Users can create telemetry events" ON profile_immersive_telemetry
  FOR INSERT WITH CHECK (auth.uid() = viewer_id OR auth.uid() = user_id);

CREATE POLICY "Users can view their profile telemetry" ON profile_immersive_telemetry
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = viewer_id);

-- Create index for telemetry performance
CREATE INDEX IF NOT EXISTS idx_profile_immersive_telemetry_user ON profile_immersive_telemetry(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_profile_immersive_telemetry_viewer ON profile_immersive_telemetry(viewer_id, created_at);