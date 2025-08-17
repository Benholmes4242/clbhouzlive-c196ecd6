-- Create profile_media table for user profile media management
CREATE TABLE public.profile_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  display_order INTEGER NOT NULL DEFAULT 0,
  file_name TEXT,
  file_size INTEGER,
  aspect_ratio NUMERIC,
  thumbnail_url TEXT,
  header_processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (header_processing_status IN ('pending', 'processing', 'success', 'error')),
  header_extended_url TEXT,
  header_strip_url TEXT,
  header_metadata JSONB DEFAULT '{}',
  header_processing_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profile_media ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile media" 
ON public.profile_media 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile media" 
ON public.profile_media 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile media" 
ON public.profile_media 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile media" 
ON public.profile_media 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Public can view profile media for public profiles" 
ON public.profile_media 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_profiles up 
  WHERE up.id = profile_media.user_id AND up.is_public = true
));

-- Create indexes for performance
CREATE INDEX idx_profile_media_user_id ON public.profile_media(user_id);
CREATE INDEX idx_profile_media_display_order ON public.profile_media(user_id, display_order);
CREATE INDEX idx_profile_media_status ON public.profile_media(header_processing_status);

-- Create updated_at trigger
CREATE TRIGGER update_profile_media_updated_at
  BEFORE UPDATE ON public.profile_media
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_media_updated_at();

-- Create constraint to limit 5 media items per user
CREATE OR REPLACE FUNCTION public.check_profile_media_limit()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;