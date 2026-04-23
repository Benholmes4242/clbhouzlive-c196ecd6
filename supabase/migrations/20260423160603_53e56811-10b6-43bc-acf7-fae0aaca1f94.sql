CREATE POLICY "Users can update own likes (upsert guard)"
ON public.post_likes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);