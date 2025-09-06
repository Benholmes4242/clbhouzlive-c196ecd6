-- Create user_top_ten_lists table for persistent storage
CREATE TABLE public.user_top_ten_lists (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  courses jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_top_ten_lists ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own top ten list" 
ON public.user_top_ten_lists 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own top ten list" 
ON public.user_top_ten_lists 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own top ten list" 
ON public.user_top_ten_lists 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for timestamps
CREATE OR REPLACE FUNCTION public.update_user_top_ten_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_top_ten_lists_updated_at
BEFORE UPDATE ON public.user_top_ten_lists
FOR EACH ROW
EXECUTE FUNCTION public.update_user_top_ten_lists_updated_at();