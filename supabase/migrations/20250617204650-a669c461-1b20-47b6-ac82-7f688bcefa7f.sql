
-- Enable RLS on golf_courses table (if not already enabled)
ALTER TABLE public.golf_courses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read golf courses (public data)
CREATE POLICY "Anyone can view golf courses" ON public.golf_courses
FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert golf courses
CREATE POLICY "Authenticated users can insert golf courses" ON public.golf_courses
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update golf courses
CREATE POLICY "Authenticated users can update golf courses" ON public.golf_courses
FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to delete golf courses
CREATE POLICY "Authenticated users can delete golf courses" ON public.golf_courses
FOR DELETE USING (auth.role() = 'authenticated');
