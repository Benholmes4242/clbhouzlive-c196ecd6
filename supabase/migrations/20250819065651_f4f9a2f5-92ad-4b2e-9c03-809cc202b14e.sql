-- Create caddie_logs table for voice recordings and notes
CREATE TABLE public.caddie_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  transcription TEXT,
  audio_url TEXT,
  location_lat DECIMAL,
  location_lng DECIMAL,
  location_name TEXT,
  course_name TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.caddie_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for caddie logs
CREATE POLICY "Users can view their own caddie logs" 
ON public.caddie_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own caddie logs" 
ON public.caddie_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own caddie logs" 
ON public.caddie_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own caddie logs" 
ON public.caddie_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_caddie_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_caddie_logs_updated_at
BEFORE UPDATE ON public.caddie_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_caddie_logs_updated_at();