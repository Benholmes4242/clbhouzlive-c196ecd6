-- Create review_tags table (mirrors post_tags structure)
CREATE TABLE IF NOT EXISTS review_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES course_ratings(id) ON DELETE CASCADE,
  tagged_entity_id UUID NOT NULL REFERENCES taggable_entities(id) ON DELETE CASCADE,
  start_index INTEGER,
  end_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX idx_review_tags_review_id ON review_tags(review_id);
CREATE INDEX idx_review_tags_tagged_entity_id ON review_tags(tagged_entity_id);

-- Prevent duplicate tags
CREATE UNIQUE INDEX idx_review_tags_unique ON review_tags(review_id, tagged_entity_id);

-- Enable RLS
ALTER TABLE review_tags ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read review tags
CREATE POLICY "Anyone can read review tags"
ON review_tags FOR SELECT USING (true);

-- Policy: Users can insert tags on their own reviews
CREATE POLICY "Users can insert review tags"
ON review_tags FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM course_ratings
    WHERE id = review_id AND user_id = auth.uid()
  )
);

-- Policy: Users can delete tags on their own reviews
CREATE POLICY "Users can delete review tags"
ON review_tags FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM course_ratings
    WHERE id = review_id AND user_id = auth.uid()
  )
);