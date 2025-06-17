
-- Create a table for friend relationships
CREATE TABLE public.user_friends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.user_friends ENABLE ROW LEVEL SECURITY;

-- Users can view friend relationships involving them
CREATE POLICY "Users can view their friend relationships" 
  ON public.user_friends 
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can create friend requests
CREATE POLICY "Users can create friend requests" 
  ON public.user_friends 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update friend requests involving them
CREATE POLICY "Users can update their friend relationships" 
  ON public.user_friends 
  FOR UPDATE 
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can delete their friend relationships
CREATE POLICY "Users can delete their friend relationships" 
  ON public.user_friends 
  FOR DELETE 
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Add some additional profile fields for user discovery
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Add an index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);
