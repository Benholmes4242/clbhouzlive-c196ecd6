
-- Insert the top 10 USA courses that were missed
-- First, let's check if they exist and insert only if they don't
INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image) 
SELECT 'Cypress Point Club', 'United States', 'California', 'North America', 1, 'Cypress Point stuns with dramatic coastal terrain where the Santa Lucia Mountains meet the Pacific. Every hole offers exhilarating elevation changes and panoramic ocean views.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Cypress Point Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image) 
SELECT 'Pine Valley Golf Club', 'United States', 'New Jersey', 'North America', 2, 'Pine Valley is George Crump''s legacy to the game—unforgiving, strategic, and brilliantly executed. Widely regarded as the pinnacle of penal golf architecture.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Pine Valley Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image) 
SELECT 'Shinnecock Hills Golf Club', 'United States', 'New York', 'North America', 3, 'Shinnecock Hills holds a unique place in golf history, not only for its role in founding the USGA but also as the site of one of the first purpose-built clubhouses.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Shinnecock Hills Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image) 
SELECT 'National Golf Links of America', 'United States', 'New York', 'North America', 4, 'National Golf Links of America is a masterpiece of early 20th-century design—part tribute, part benchmark for modern architects, and all classic charm.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'National Golf Links of America' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image) 
SELECT 'Oakmont Country Club', 'United States', 'Pennsylvania', 'North America', 5, 'Oakmont is as brutal as it is brilliant. A beast of a course that''s hosted more majors than any in the U.S. outside Augusta—and tests the best every time.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Oakmont Country Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image) 
SELECT 'Sand Hills Golf Club', 'United States', 'Nebraska', 'North America', 6, 'Sand Hills offers a spiritual kind of golf—a course built on simplicity, natural design, and a proud resistance to commercial fanfare.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Sand Hills Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image) 
SELECT 'Merion Golf Club (East)', 'United States', 'Pennsylvania', 'North America', 7, 'Merion may be old, but it''s far from outdated. This Philadelphia gem evolved from cricket-playing roots to host some of the game''s most storied moments.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Merion Golf Club (East)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image) 
SELECT 'Augusta National Golf Club', 'United States', 'Georgia', 'North America', 8, 'Augusta National is where golf''s finest minds met perfection. Jones and MacKenzie created more than just a course—they created legend.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Augusta National Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image) 
SELECT 'Los Angeles Country Club (North)', 'United States', 'California', 'North America', 9, 'Los Angeles Country Club''s North Course lives up to its postcode. Elegant, exclusive, and architecturally rich—it''s a course that matches its prestigious setting.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Los Angeles Country Club (North)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, usa_rank, description, thumbnail_image) 
SELECT 'Fishers Island Club', 'United States', 'New York', 'North America', 10, 'Fishers Island Club is a coastal gem—remote and romantic. Playing here feels like stepping into a time capsule lined with ocean spray.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Fishers Island Club' AND country = 'United States');
