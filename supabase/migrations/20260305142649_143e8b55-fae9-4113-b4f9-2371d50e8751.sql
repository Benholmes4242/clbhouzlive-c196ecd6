
-- Post reports
CREATE TABLE IF NOT EXISTS post_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, reporter_id)
);

ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can report posts" ON post_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can see own reports" ON post_reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

-- Not interested / dismissals
CREATE TABLE IF NOT EXISTS post_dismissals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_dismissals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can dismiss posts" ON post_dismissals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can see own dismissals" ON post_dismissals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
