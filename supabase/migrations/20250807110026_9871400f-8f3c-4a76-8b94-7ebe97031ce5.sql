-- Create user_badge_pins table for profile showcase badges
CREATE TABLE public.user_badge_pins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  pinned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_badge_pins ENABLE ROW LEVEL SECURITY;

-- Create policies for user_badge_pins
CREATE POLICY "Users can view badge pins" 
ON public.user_badge_pins 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own badge pins" 
ON public.user_badge_pins 
FOR ALL
USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_user_badge_pins_user_id ON public.user_badge_pins(user_id);
CREATE INDEX idx_user_badge_pins_badge_id ON public.user_badge_pins(badge_id);