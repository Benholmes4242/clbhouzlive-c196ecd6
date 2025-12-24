-- Add public read policy to post_media to match posts table
-- This fixes the race condition where posts query runs before auth session is ready after login
CREATE POLICY "public_read_post_media" ON public.post_media
FOR SELECT
TO public
USING (true);