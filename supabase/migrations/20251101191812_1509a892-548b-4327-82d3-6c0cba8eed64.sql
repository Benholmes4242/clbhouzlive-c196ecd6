-- Drop existing insert policy and create proper one
DROP POLICY IF EXISTS "games_insert_logged_in" ON games;

-- Allow authenticated users to insert games where they are the host
CREATE POLICY "Users can insert own games"
ON games FOR INSERT
WITH CHECK (host_user_id = auth.uid());

-- Ensure we have proper SELECT policy (already exists but verify)
DROP POLICY IF EXISTS "games_read" ON games;
CREATE POLICY "Users can view games"
ON games FOR SELECT
USING (user_can_see_game(id, auth.uid()));

-- Ensure UPDATE policy exists (already exists)
DROP POLICY IF EXISTS "games_owner_update" ON games;
CREATE POLICY "Users can update own games"
ON games FOR UPDATE
USING (host_user_id = auth.uid())
WITH CHECK (host_user_id = auth.uid());

-- Ensure DELETE policy exists (already exists)
DROP POLICY IF EXISTS "games_owner_delete" ON games;
CREATE POLICY "Users can delete own games"
ON games FOR DELETE
USING (host_user_id = auth.uid());