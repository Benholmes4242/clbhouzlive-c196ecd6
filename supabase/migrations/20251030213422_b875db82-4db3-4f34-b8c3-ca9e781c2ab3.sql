-- Add RLS policy to allow game participants to view their games
CREATE POLICY "Participants can view their games"
ON games FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM game_participants
    WHERE game_participants.game_id = games.id
      AND game_participants.user_id = auth.uid()
      AND game_participants.state IN ('invited', 'accepted')
  )
);