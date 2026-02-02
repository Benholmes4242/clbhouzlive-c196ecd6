-- Create comment_reactions table for golf-themed reactions
CREATE TABLE comment_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('heart', 'fire', 'flag', 'eagle', 'birdie', 'clap')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id, reaction_type)
);

-- Create indexes for fast lookups
CREATE INDEX idx_comment_reactions_comment ON comment_reactions(comment_id);
CREATE INDEX idx_comment_reactions_user ON comment_reactions(user_id);

-- Enable RLS
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view all reactions"
  ON comment_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can add their own reactions"
  ON comment_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
  ON comment_reactions FOR DELETE
  USING (auth.uid() = user_id);