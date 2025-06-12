
-- Create a table to store news articles
CREATE TABLE public.news_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  link TEXT NOT NULL,
  pub_date TIMESTAMP WITH TIME ZONE,
  source TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create an index on pub_date for faster sorting
CREATE INDEX idx_news_articles_pub_date ON public.news_articles(pub_date DESC);

-- Create an index on source for filtering
CREATE INDEX idx_news_articles_source ON public.news_articles(source);

-- Enable RLS (though we'll make it publicly readable)
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

-- Create policy that allows everyone to read news articles
CREATE POLICY "Anyone can view news articles" 
  ON public.news_articles 
  FOR SELECT 
  USING (true);

-- Create policy that only allows system to insert/update articles
CREATE POLICY "System can manage news articles" 
  ON public.news_articles 
  FOR ALL 
  USING (false)
  WITH CHECK (false);
