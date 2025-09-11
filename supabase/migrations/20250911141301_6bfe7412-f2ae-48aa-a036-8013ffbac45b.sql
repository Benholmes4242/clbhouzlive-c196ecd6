-- Create review_votes table for helpful/unhelpful voting
CREATE TABLE public.review_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL,
  user_id UUID NOT NULL,
  value INTEGER NOT NULL CHECK (value IN (-1, 1)), -- -1 for unhelpful, 1 for helpful
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index to prevent duplicate votes from same user on same review
CREATE UNIQUE INDEX idx_review_votes_unique ON public.review_votes (review_id, user_id);

-- Create indexes for performance
CREATE INDEX idx_review_votes_review_id ON public.review_votes (review_id);
CREATE INDEX idx_review_votes_user_id ON public.review_votes (user_id);

-- Enable Row Level Security
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all review votes" 
ON public.review_votes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own votes" 
ON public.review_votes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" 
ON public.review_votes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" 
ON public.review_votes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_review_votes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_review_votes_updated_at
BEFORE UPDATE ON public.review_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_review_votes_updated_at();

-- Add helpful_count and unhelpful_count columns to course_ratings table for denormalized counters
ALTER TABLE public.course_ratings 
ADD COLUMN helpful_count INTEGER DEFAULT 0,
ADD COLUMN unhelpful_count INTEGER DEFAULT 0;

-- Create function to recalculate vote counts for a review
CREATE OR REPLACE FUNCTION public.recalculate_review_vote_counts(review_id_param UUID)
RETURNS VOID AS $$
DECLARE
  helpful_total INTEGER;
  unhelpful_total INTEGER;
BEGIN
  -- Calculate totals from review_votes
  SELECT 
    COALESCE(SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END), 0)
  INTO helpful_total, unhelpful_total
  FROM public.review_votes
  WHERE review_id = review_id_param;
  
  -- Update the course_ratings table
  UPDATE public.course_ratings
  SET 
    helpful_count = helpful_total,
    unhelpful_count = unhelpful_total,
    updated_at = now()
  WHERE id = review_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update vote counts when review_votes change
CREATE OR REPLACE FUNCTION public.update_review_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM public.recalculate_review_vote_counts(NEW.review_id);
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_review_vote_counts(OLD.review_id);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for automatic vote count updates
CREATE TRIGGER review_votes_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.review_votes
FOR EACH ROW EXECUTE FUNCTION public.update_review_vote_counts();