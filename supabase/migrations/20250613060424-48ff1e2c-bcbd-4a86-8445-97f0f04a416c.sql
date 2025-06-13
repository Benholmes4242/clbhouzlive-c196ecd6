
-- Create enum for continents
CREATE TYPE public.continent AS ENUM (
  'North America',
  'South America', 
  'Europe',
  'Asia',
  'Africa',
  'Oceania'
);

-- Create golf courses table
CREATE TABLE public.golf_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  continent continent NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  global_rank INTEGER,
  regional_rank INTEGER,
  description TEXT,
  thumbnail_image TEXT,
  website_url TEXT,
  top100_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user course tracking table
CREATE TABLE public.user_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  course_id UUID REFERENCES public.golf_courses(id) ON DELETE CASCADE NOT NULL,
  played BOOLEAN DEFAULT FALSE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  photo_url TEXT,
  played_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS on both tables
ALTER TABLE public.golf_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;

-- Golf courses are public (readable by everyone)
CREATE POLICY "Golf courses are viewable by everyone" 
  ON public.golf_courses 
  FOR SELECT 
  USING (true);

-- User course tracking policies
CREATE POLICY "Users can view their own course tracking" 
  ON public.user_courses 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own course tracking" 
  ON public.user_courses 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own course tracking" 
  ON public.user_courses 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own course tracking" 
  ON public.user_courses 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_golf_courses_country ON public.golf_courses(country);
CREATE INDEX idx_golf_courses_continent ON public.golf_courses(continent);
CREATE INDEX idx_golf_courses_global_rank ON public.golf_courses(global_rank) WHERE global_rank IS NOT NULL;
CREATE INDEX idx_golf_courses_regional_rank ON public.golf_courses(regional_rank) WHERE regional_rank IS NOT NULL;
CREATE INDEX idx_golf_courses_location ON public.golf_courses(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_user_courses_user_id ON public.user_courses(user_id);
CREATE INDEX idx_user_courses_played ON public.user_courses(played) WHERE played = true;

-- Insert some sample data for Top 100 courses
INSERT INTO public.golf_courses (name, country, region, continent, latitude, longitude, global_rank, regional_rank, description, thumbnail_image) VALUES
('Augusta National Golf Club', 'United States', 'Georgia', 'North America', 33.5032, -82.0199, 1, 1, 'Home of the Masters Tournament, one of the most exclusive and prestigious golf courses in the world.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'),
('St Andrews Old Course', 'Scotland', 'Fife', 'Europe', 56.3422, -2.8009, 2, 1, 'The Home of Golf - the most famous golf course in the world and birthplace of the game.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Pebble Beach Golf Links', 'United States', 'California', 'North America', 36.5674, -121.9489, 3, 2, 'Stunning oceanfront course featuring dramatic cliffs and breathtaking views of the Pacific Ocean.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'),
('Muirfield', 'Scotland', 'East Lothian', 'Europe', 56.0481, -2.8134, 4, 2, 'Championship links course known for its challenging layout and rich history in professional golf.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Royal County Down', 'Northern Ireland', 'Newcastle', 'Europe', 54.2329, -5.8839, 5, 3, 'Spectacular links course set against the backdrop of the Mourne Mountains.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Shinnecock Hills Golf Club', 'United States', 'New York', 'North America', 40.8871, -72.4561, 6, 3, 'Classic American links-style course and frequent host of major championships.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'),
('Royal Melbourne Golf Club', 'Australia', 'Victoria', 'Oceania', -37.9722, 145.0361, 7, 1, 'Premier Australian golf course known for its superb design and championship pedigree.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'),
('Turnberry Ailsa Course', 'Scotland', 'Ayrshire', 'Europe', 55.3098, -4.8459, 8, 4, 'Dramatic clifftop course with stunning views and legendary lighthouse backdrop.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Royal Birkdale Golf Club', 'England', 'Lancashire', 'Europe', 53.6089, -3.0503, 9, 5, 'Championship links course with distinctive white clubhouse and challenging sandhills layout.', 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'),
('Oakmont Country Club', 'United States', 'Pennsylvania', 'North America', 40.5217, -79.8556, 10, 4, 'Notoriously difficult course known for its lightning-fast greens and penal rough.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop');
