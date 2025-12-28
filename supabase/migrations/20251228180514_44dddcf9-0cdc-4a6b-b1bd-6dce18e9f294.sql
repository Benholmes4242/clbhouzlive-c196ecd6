-- Add badges column to posts table for moment achievements
-- Badges are optional score achievements like Eagle, Birdie, HIO, Breaking 80, etc.

ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS badges text[] NOT NULL DEFAULT '{}';

-- Create GIN index for efficient array containment queries (for filtering)
CREATE INDEX IF NOT EXISTS posts_badges_gin_idx ON public.posts USING GIN (badges);

-- Add constraint to prevent empty string badges
ALTER TABLE public.posts 
ADD CONSTRAINT posts_badges_no_empty CHECK (NOT ('' = ANY(badges)));