
-- Create logos table for storing uploaded logos
CREATE TABLE public.logos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('handicap_bodies', 'golf_clubs', 'universities', 'golf_tours')),
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add RLS policies for logos table
ALTER TABLE public.logos ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all logos
CREATE POLICY "Admins can view all logos" 
  ON public.logos 
  FOR SELECT 
  USING (public.is_admin());

-- Allow admins to insert logos
CREATE POLICY "Admins can insert logos" 
  ON public.logos 
  FOR INSERT 
  WITH CHECK (public.is_admin());

-- Allow admins to update logos
CREATE POLICY "Admins can update logos" 
  ON public.logos 
  FOR UPDATE 
  USING (public.is_admin());

-- Allow admins to delete logos
CREATE POLICY "Admins can delete logos" 
  ON public.logos 
  FOR DELETE 
  USING (public.is_admin());

-- Create logos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

-- Storage policies for logos
CREATE POLICY "Admins can upload logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'logos' AND public.is_admin());

CREATE POLICY "Anyone can view logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

CREATE POLICY "Admins can update logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'logos' AND public.is_admin());

CREATE POLICY "Admins can delete logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'logos' AND public.is_admin());

-- Add email change functionality to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS pending_email TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email_change_token TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email_change_requested_at TIMESTAMP WITH TIME ZONE;
