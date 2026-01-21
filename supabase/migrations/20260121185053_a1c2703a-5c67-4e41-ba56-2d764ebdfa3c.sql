-- Drop existing policy that conflicts
DROP POLICY IF EXISTS "Users can update their own presence" ON public.user_presence;

-- Recreate with correct name
CREATE POLICY "Users can manage their own presence" 
ON public.user_presence FOR ALL 
USING (user_id = auth.uid());

-- Enable realtime for new tables (with IF NOT EXISTS equivalent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'typing_indicators'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_presence'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'message_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Create message-media storage bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-media', 
  'message-media', 
  true, 
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for message-media (drop if exist first)
DROP POLICY IF EXISTS "Users can upload message media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view message media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own message media" ON storage.objects;

CREATE POLICY "Users can upload message media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view message media"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-media');

CREATE POLICY "Users can delete their own message media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'message-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);