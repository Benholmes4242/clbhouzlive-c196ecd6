
-- Add content column to news_articles table to store full article content
ALTER TABLE public.news_articles 
ADD COLUMN IF NOT EXISTS content TEXT;

-- Update the column comment
COMMENT ON COLUMN public.news_articles.content IS 'Full article content from news sources';
