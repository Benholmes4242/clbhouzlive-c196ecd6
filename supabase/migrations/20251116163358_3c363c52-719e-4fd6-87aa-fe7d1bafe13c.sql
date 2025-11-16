-- Create course_review_votes table for helpful/unhelpful voting on reviews
CREATE TABLE IF NOT EXISTS public.course_review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID NOT NULL REFERENCES public.course_ratings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'unhelpful')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rating_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_course_review_votes_rating ON public.course_review_votes(rating_id);
CREATE INDEX IF NOT EXISTS idx_course_review_votes_user ON public.course_review_votes(user_id);

-- RLS
ALTER TABLE public.course_review_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review votes" 
ON public.course_review_votes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own votes" 
ON public.course_review_votes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" 
ON public.course_review_votes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" 
ON public.course_review_votes 
FOR DELETE 
USING (auth.uid() = user_id);