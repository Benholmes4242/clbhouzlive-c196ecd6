
-- Table to store the clubs and balls each user plays with ("What's in the Bag")
CREATE TABLE public.user_bag (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- e.g., driver, wood, hybrid, iron, wedge, putter, ball, etc.
  brand TEXT NOT NULL,
  model TEXT,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable row level security
ALTER TABLE public.user_bag ENABLE ROW LEVEL SECURITY;

-- Users can view their own bag
CREATE POLICY "Users can view their own bag"
  ON public.user_bag
  FOR SELECT USING (auth.uid() = user_id);

-- Users can add clubs/balls to their own bag
CREATE POLICY "Users can add to their own bag"
  ON public.user_bag
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own bag
CREATE POLICY "Users can update their own bag"
  ON public.user_bag
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can remove clubs/balls from their own bag
CREATE POLICY "Users can delete from their own bag"
  ON public.user_bag
  FOR DELETE USING (auth.uid() = user_id);
