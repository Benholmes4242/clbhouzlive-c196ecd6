
-- PRIORITY 1: Fix conflicting CHECK constraints on comment_reactions
ALTER TABLE comment_reactions DROP CONSTRAINT IF EXISTS valid_reaction_type;
ALTER TABLE comment_reactions DROP CONSTRAINT IF EXISTS comment_reactions_comment_id_user_id_reaction_type_key;

-- Recreate correct check constraint matching code ('flag' not 'golf')
ALTER TABLE comment_reactions ADD CONSTRAINT valid_reaction_type 
  CHECK (reaction_type IN ('heart', 'fire', 'flag', 'eagle', 'birdie', 'clap'));

-- Fix duplicate unique constraint on comment_likes
ALTER TABLE comment_likes DROP CONSTRAINT IF EXISTS comment_likes_comment_id_user_id_key;

-- PRIORITY 3: Add voice note columns to post_comments
ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS media_type text;
ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS voice_duration_seconds integer;

-- Constrain media_type values
DO $$ BEGIN
  ALTER TABLE post_comments ADD CONSTRAINT valid_media_type 
    CHECK (media_type IS NULL OR media_type IN ('voice', 'image'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create storage bucket for voice notes
INSERT INTO storage.buckets (id, name, public)
VALUES ('comment-voice-notes', 'comment-voice-notes', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: any authenticated user can upload
CREATE POLICY "Authenticated users can upload voice notes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'comment-voice-notes');

-- RLS: anyone can read (comments are public)
CREATE POLICY "Anyone can read voice notes"
ON storage.objects FOR SELECT
USING (bucket_id = 'comment-voice-notes');

-- RLS: only owner can delete
CREATE POLICY "Users can delete own voice notes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'comment-voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);
