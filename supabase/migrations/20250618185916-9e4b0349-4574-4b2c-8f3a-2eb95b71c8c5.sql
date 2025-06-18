
-- Insert the top 30 golf courses worldwide with their global rankings
-- Using simpler approach without ON CONFLICT since we have WHERE NOT EXISTS checks

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Cypress Point Club', 'United States', 'California', 'North America', 'Set on the Monterey Peninsula, Cypress Point is known for its thrilling cliffside holes and unforgettable scenery.', 1, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Cypress Point Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Pine Valley Golf Club', 'United States', 'New Jersey', 'North America', 'Designed by George Crump, this is often considered the gold standard for penal golf course architecture.', 2, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Pine Valley Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Shinnecock Hills Golf Club', 'United States', 'New York', 'North America', 'Founding member of the USGA with one of the first purpose-built clubhouses.', 4, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Shinnecock Hills Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'National Golf Links of America', 'United States', 'New York', 'North America', 'A tribute to the great holes of the world, crafted by C.B. Macdonald.', 5, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'National Golf Links of America' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Royal Melbourne Golf Club (West)', 'Australia', 'Victoria', 'Oceania', 'Australia''s finest course and a MacKenzie masterpiece.', 6, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Royal Melbourne Golf Club (West)' AND country = 'Australia');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Oakmont Country Club', 'United States', 'Pennsylvania', 'North America', 'One of the toughest major venues in the world, second only to Augusta in hosting history.', 8, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Oakmont Country Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Sand Hills Golf Club', 'United States', 'Nebraska', 'North America', 'Remote, natural, minimalist design that helped launch the modern golf architecture renaissance.', 11, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Sand Hills Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Merion Golf Club (East)', 'United States', 'Pennsylvania', 'North America', 'Historic venue with intricate routing and major pedigree.', 13, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Merion Golf Club (East)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Hirono Golf Club', 'Japan', 'Kinki (Kansai)', 'Asia', 'Japan''s premier course — a masterful and elegant inland design.', 14, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Hirono Golf Club' AND country = 'Japan');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Augusta National Golf Club', 'United States', 'Georgia', 'North America', 'Home of The Masters, co-designed by Bobby Jones and Alister MacKenzie.', 16, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Augusta National Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Kingston Heath Golf Club', 'Australia', 'Victoria', 'Oceania', 'A short, strategic masterpiece in Melbourne''s sandbelt.', 17, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Kingston Heath Golf Club' AND country = 'Australia');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Los Angeles Country Club (North)', 'United States', 'California', 'North America', 'Exclusive and impeccably designed, recently host to the U.S. Open.', 18, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Los Angeles Country Club (North)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Fishers Island Club', 'United States', 'New York', 'North America', 'Romantically set on a remote island, this gem remains private and pristine.', 20, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Fishers Island Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Tara Iti', 'New Zealand', 'North Island', 'Oceania', 'Doak-designed modern marvel set on New Zealand''s east coast.', 21, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Tara Iti' AND country = 'New Zealand');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Friar''s Head', 'United States', 'New York', 'North America', 'Bill Coore and Ben Crenshaw''s modern routing across 350 dramatic acres.', 23, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Friar''s Head' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Chicago Golf Club', 'United States', 'Illinois', 'North America', 'One of the oldest and most exclusive clubs in America.', 24, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Chicago Golf Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Barnbougle (The Dunes)', 'Australia', 'Tasmania', 'Oceania', 'Australia''s most authentic links — dramatic, wild, and windswept.', 25, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Barnbougle (The Dunes)' AND country = 'Australia');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Bandon Dunes (Pacific Dunes)', 'United States', 'Oregon', 'North America', 'Doak''s standout course in a world-class resort lineup.', 26, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Bandon Dunes (Pacific Dunes)' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Pebble Beach Golf Links', 'United States', 'California', 'North America', 'America''s most iconic public-access course, hugging the Pacific coast.', 27, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Pebble Beach Golf Links' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Prairie Dunes Country Club', 'United States', 'Kansas', 'North America', 'A pure inland links, full of character and challenge.', 28, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Prairie Dunes Country Club' AND country = 'United States');

INSERT INTO public.golf_courses (name, country, region, continent, description, global_rank, regional_rank, thumbnail_image)
SELECT 'Riviera Country Club', 'United States', 'California', 'North America', 'A shot-maker''s paradise and regular PGA Tour stop with timeless design.', 30, NULL, 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
WHERE NOT EXISTS (SELECT 1 FROM public.golf_courses WHERE name = 'Riviera Country Club' AND country = 'United States');

-- Update existing courses with their global rankings
UPDATE public.golf_courses SET global_rank = 3, regional_rank = 1 WHERE name = 'Royal County Down (Championship)' AND country = 'United Kingdom';
UPDATE public.golf_courses SET global_rank = 7, regional_rank = 2 WHERE name = 'St Andrews Links (Old)' AND country = 'United Kingdom';
UPDATE public.golf_courses SET global_rank = 9, regional_rank = 3 WHERE name = 'Royal Portrush Golf Club (Dunluce)' AND country = 'United Kingdom';
UPDATE public.golf_courses SET global_rank = 10, regional_rank = 4 WHERE name = 'Muirfield - Honourable Company of Edinburgh Golfers' AND country = 'United Kingdom';
UPDATE public.golf_courses SET global_rank = 12, regional_rank = 5 WHERE name = 'Trump Turnberry Resort - Ailsa' AND country = 'United Kingdom';
UPDATE public.golf_courses SET global_rank = 15, regional_rank = 6 WHERE name = 'Royal Dornoch Golf Club (Championship)' AND country = 'United Kingdom';
UPDATE public.golf_courses SET global_rank = 19, regional_rank = 7 WHERE name = 'Royal St George''s Golf Club' AND country = 'United Kingdom';
UPDATE public.golf_courses SET global_rank = 22, regional_rank = 8 WHERE name = 'Sunningdale Golf Club (Old)' AND country = 'United Kingdom';
UPDATE public.golf_courses SET global_rank = 29, regional_rank = 9 WHERE name = 'Ballybunion Golf Club (Old)' AND country = 'Ireland';
