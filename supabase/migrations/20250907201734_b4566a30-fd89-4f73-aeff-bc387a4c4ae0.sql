-- Enable Row Level Security for user_top_ten_lists table
ALTER TABLE public.user_top_ten_lists ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read all Top 10 lists (for viewing other profiles)
CREATE POLICY "Anyone can read top 10 lists"
  ON public.user_top_ten_lists FOR SELECT
  USING (true);

-- Policy: Users can only insert their own Top 10 list
CREATE POLICY "Users can insert own top 10"
  ON public.user_top_ten_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own Top 10 list
CREATE POLICY "Users can update own top 10"
  ON public.user_top_ten_lists FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own Top 10 list
CREATE POLICY "Users can delete own top 10"
  ON public.user_top_ten_lists FOR DELETE
  USING (auth.uid() = user_id);