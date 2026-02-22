
-- Allow the compute function to insert/update ratings
CREATE POLICY "Allow insert for compute function" ON player_ratings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for compute function" ON player_ratings
  FOR UPDATE USING (true) WITH CHECK (true);
