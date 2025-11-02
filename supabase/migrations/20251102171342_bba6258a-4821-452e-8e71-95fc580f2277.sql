-- Allow users to view profiles of participants in games they host or have joined
CREATE POLICY "Users can view profiles of game participants"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT gp.user_id
    FROM game_participants gp
    JOIN games g ON g.id = gp.game_id
    WHERE g.host_user_id = auth.uid()
       OR EXISTS (
         SELECT 1 FROM game_participants gp2
         WHERE gp2.game_id = g.id AND gp2.user_id = auth.uid()
       )
  )
);